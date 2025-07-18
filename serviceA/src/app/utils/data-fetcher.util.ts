import axios from 'axios';
import { MongoClient } from 'mongodb';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { Metric } from '../types';
import { config } from './config.util';

export async function fetchAndSaveData(): Promise<number> {
  const url = config.dataFetcher.url;
  console.log(`Starting streaming data fetch from: ${url}`);

  try {
    // Connect to MongoDB first
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(config.mongodb.uri);
    await client.connect();
    console.log('MongoDB connection established');

    const db = client.db(config.mongodb.dbName);
    const collection = db.collection('metrics');

    // Fetch data using stream with extended timeout
    console.log('Initiating HTTP request...');
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 120000 // 2 minutes for large file download
    });

    console.log(`Response received, status: ${response.status}, content-length: ${response.headers['content-length']}`);

    let processedCount = 0;
    let buffer = '';

    // Create transform stream to process JSON data on-the-fly
    const transformStream = new Transform({
      objectMode: false,
      transform(chunk, encoding, callback) {
        try {
          buffer += chunk.toString();

          // Try to parse complete JSON objects from buffer
          let bracketCount = 0;
          let startIndex = 0;
          let inString = false;
          let escaped = false;

          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];

            if (escaped) {
              escaped = false;
              continue;
            }

            if (char === '\\') {
              escaped = true;
              continue;
            }

            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === '{') {
                if (bracketCount === 0) {
                  startIndex = i;
                }
                bracketCount++;
              } else if (char === '}') {
                bracketCount--;
                if (bracketCount === 0) {
                  // Found complete JSON object
                  const jsonStr = buffer.substring(startIndex, i + 1);
                  try {
                    const record = JSON.parse(jsonStr);
                    this.push(JSON.stringify(record) + '\n');
                  } catch (parseError) {
                    console.warn('Failed to parse JSON object:', parseError);
                  }
                }
              }
            }
          }

          // Keep remaining incomplete data in buffer
          if (bracketCount === 0) {
            buffer = '';
          } else if (startIndex > 0) {
            buffer = buffer.substring(startIndex);
          }

          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });

    // Create MongoDB write stream
    const mongoWriteStream = new Transform({
      objectMode: true,
      async transform(chunk, encoding, callback) {
        try {
          const lines = chunk.toString().split('\n').filter((line: string) => line.trim());

          for (const line of lines) {
            if (line.trim()) {
              const record = JSON.parse(line);

              // Transform sensor data to metrics format
              const metrics: Metric[] = [];

              if (record.temperature !== undefined) {
                metrics.push({
                  label: `temp_${record.source || 'unknown'}_${processedCount}`,
                  value: record.temperature
                });
              }
              if (record.humidity !== undefined) {
                metrics.push({
                  label: `humidity_${record.source || 'unknown'}_${processedCount}`,
                  value: record.humidity
                });
              }
              if (record.pressure !== undefined) {
                metrics.push({
                  label: `pressure_${record.source || 'unknown'}_${processedCount}`,
                  value: record.pressure
                });
              }

              // Bulk insert metrics to MongoDB
              if (metrics.length > 0) {
                const bulkOps = metrics.map((metric: Metric) => ({
                  updateOne: {
                    filter: { label: metric.label },
                    update: { $set: metric },
                    upsert: true
                  }
                }));

                await collection.bulkWrite(bulkOps);
                processedCount++;

                if (processedCount % 100 === 0) {
                  console.log(`Processed ${processedCount} records...`);
                }
              }
            }
          }

          callback();
        } catch (error) {
          console.error('Error processing chunk:', error);
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });

    console.log('Starting data streaming and transformation...');

    // Use pipeline for proper backpressure handling
    await pipeline(
      response.data,
      transformStream,
      mongoWriteStream
    );

    await client.close();
    console.log('MongoDB connection closed');
    console.log(`Data processing completed. Processed ${processedCount} records.`);

    return processedCount;
  } catch (error) {
    console.error('Error fetching and streaming data:', error);
    throw error;
  }
}

