import axios from 'axios';
import { MongoClient } from 'mongodb';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { config } from './config.util';

export async function fetchAndSaveData(): Promise<number> {
  const url = config.dataFetcher.url;
  console.log(`Starting streaming data fetch from: ${url}`);

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}/${maxRetries}`);

      // Connect to MongoDB first
      console.log('Connecting to MongoDB...');
      const client = new MongoClient(config.mongodb.uri);
      await client.connect();
      console.log('MongoDB connection established');

      const db = client.db(config.mongodb.dbName);
      const collection = db.collection('metrics');

      // Fetch data using stream with enhanced connection settings
      console.log('Initiating HTTP request...');
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 0, // Disable timeout for large files
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'User-Agent': 'ServiceA-Data-Fetcher/1.0',
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        httpAgent: new (require('http').Agent)({
          keepAlive: true,
          timeout: 300000, // 5 minutes
          maxSockets: 1
        }),
        httpsAgent: new (require('https').Agent)({
          keepAlive: true,
          timeout: 300000, // 5 minutes
          maxSockets: 1
        })
      });

      console.log(`Response received, status: ${response.status}, content-length: ${response.headers['content-length']}`);

      let processedCount = 0;
      let connectionAborted = false;

      // Add error handling for the response stream
      response.data.on('error', (error: Error) => {
        console.error('Stream error:', error);
        connectionAborted = true;
      });

      response.data.on('close', () => {
        if (connectionAborted) {
          console.log('Stream closed due to connection abort');
        }
      });

            // Create JSON parsing stream that handles simple JSON array format
      let jsonBuffer = '';
      let braceCount = 0;
      let recordCount = 0;
      let insideArray = false;

      const jsonParsingStream = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          try {
            const data = chunk.toString();
            console.log(`JSON parser received chunk: ${data.length} chars`);

            for (let i = 0; i < data.length; i++) {
              const char = data[i];

              // Look for the opening [ to start parsing
              if (!insideArray && char === '[') {
                insideArray = true;
                console.log('🎯 Found array start, beginning to parse JSON objects');
                continue;
              }

              // Only process if we're inside the array
              if (insideArray) {
                // Skip the closing ] of the array
                if (char === ']' && braceCount === 0) {
                  console.log('🏁 Reached end of JSON array');
                  break;
                }

                if (char === '{') {
                  // Start of a new JSON object
                  if (braceCount === 0) {
                    jsonBuffer = char; // Start fresh
                  } else {
                    jsonBuffer += char;
                  }
                  braceCount++;
                } else if (char === '}') {
                  jsonBuffer += char;
                  braceCount--;

                  // When braceCount reaches 0, we have a complete JSON object
                  if (braceCount === 0) {
                    const jsonLine = jsonBuffer.trim();
                    if (jsonLine.startsWith('{') && jsonLine.endsWith('}')) {
                      console.log(`🎉 Found complete JSON object ${recordCount + 1}: ${jsonLine.substring(0, 100)}...`);
                      this.push(jsonLine + '\n');
                      recordCount++;
                      jsonBuffer = '';
                    }
                  }
                } else if (braceCount > 0) {
                  // We're inside a JSON object, keep adding characters
                  jsonBuffer += char;
                }
                // Skip commas, spaces, newlines between objects when braceCount is 0
              }
            }

            console.log(`Processed ${recordCount} complete JSON objects so far`);
            callback();
          } catch (error) {
            console.error('JSON parsing error:', error);
            callback(error instanceof Error ? error : new Error(String(error)));
          }
        }
      });      // Create MongoDB write stream with aggressive batching and optimizations
      interface MetricDoc {
        label: string;
        value: number;
        timestamp: Date;
        source: string;
        type: string;
      }

      let batchBuffer: MetricDoc[] = [];
      const BATCH_SIZE = 5000; // Much larger batch size for better performance

      const mongoWriteStream = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          try {
            if (connectionAborted) {
              callback(new Error('Connection aborted'));
              return;
            }

            // Chunk is now a single JSON string from the parsing stream
            const jsonString = chunk.toString().trim();
            if (jsonString) {
              try {
                const record = JSON.parse(jsonString);

                // Transform sensor data to metrics format - simplified and faster
                if (record.temperature !== undefined) {
                  batchBuffer.push({
                    label: `temp_${record.source || 'unknown'}_${processedCount}`,
                    value: record.temperature,
                    timestamp: new Date(record.timestamp || new Date()),
                    source: record.source || 'unknown',
                    type: 'temperature'
                  });
                }
                if (record.humidity !== undefined) {
                  batchBuffer.push({
                    label: `humidity_${record.source || 'unknown'}_${processedCount}`,
                    value: record.humidity,
                    timestamp: new Date(record.timestamp || new Date()),
                    source: record.source || 'unknown',
                    type: 'humidity'
                  });
                }
                if (record.pressure !== undefined) {
                  batchBuffer.push({
                    label: `pressure_${record.source || 'unknown'}_${processedCount}`,
                    value: record.pressure,
                    timestamp: new Date(record.timestamp || new Date()),
                    source: record.source || 'unknown',
                    type: 'pressure'
                  });
                }

                processedCount++;

                // Flush batch when it reaches BATCH_SIZE
                if (batchBuffer.length >= BATCH_SIZE) {
                  // Use insertMany instead of bulkWrite - much faster for new data
                  setImmediate(async () => {
                    try {
                      const startTime = Date.now();
                      await collection.insertMany(batchBuffer, { ordered: false });
                      const duration = Date.now() - startTime;
                      console.log(`⚡ Processed ${processedCount} records (batch: ${batchBuffer.length} docs in ${duration}ms)`);
                    } catch {
                      // If some docs already exist, that's OK - just log and continue
                      console.log(`📝 Batch insert: ${batchBuffer.length} docs (some may be duplicates)`);
                    }
                  });
                  batchBuffer = []; // Clear batch immediately
                }
              } catch (parseError) {
                console.error('Error parsing JSON record:', parseError);
                // Skip invalid JSON records
              }
            }

            callback(); // Non-blocking callback
          } catch (error) {
            console.error('Error processing chunk:', error);
            callback(); // Continue processing even on errors
          }
        },

        // Flush remaining batch when stream ends
        flush(callback) {
          if (batchBuffer.length > 0) {
            setImmediate(async () => {
              try {
                await collection.insertMany(batchBuffer, { ordered: false });
                console.log(`🏁 Final batch: ${batchBuffer.length} docs inserted`);
              } catch {
                console.log(`🏁 Final batch: ${batchBuffer.length} docs (some may be duplicates)`);
              }
              callback();
            });
          } else {
            callback();
          }
        }
      });

      console.log('Starting data streaming and transformation...');

      // Use pipeline for proper backpressure handling
      await pipeline(
        response.data,
        jsonParsingStream,
        mongoWriteStream
      );

      await client.close();
      console.log('MongoDB connection closed');
      console.log(`Data processing completed. Processed ${processedCount} records.`);

      return processedCount; // Success, return the count

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? (error as Error & { code: string }).code : undefined;

      console.error(`Attempt ${retryCount + 1} failed:`, errorMessage);

      if (errorCode === 'ECONNRESET' || errorCode === 'ECONNABORTED' || errorMessage.includes('aborted')) {
        retryCount++;
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry
        }
      }

      // If not a retryable error or max retries reached, throw
      throw new Error(`Failed to fetch data after ${retryCount} attempts: ${errorMessage}`);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error(`Failed to fetch data after ${maxRetries} attempts`);
}

