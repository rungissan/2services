import axios from 'axios';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { config } from './config.util';

export async function fetchAndSaveData(): Promise<void> {
  const url = config.dataFetcher.url;

  try {
    // Fetch data using stream
    const response = await axios.get(url, { responseType: 'stream' });

    // Save as JSON using stream pipeline
    const jsonPath = './data.json';
    const jsonStream = fs.createWriteStream(jsonPath);

    // Use pipeline for proper backpressure handling
    await pipeline(response.data, jsonStream);

    console.log(`Data successfully saved to ${jsonPath}`);
  } catch (error) {
    console.error('Error fetching and saving data:', error);
    throw error;
  }
}
