import fs from 'fs';
import { MongoClient } from 'mongodb';
import multer from 'multer';
import path from 'path';
import { Metric, MetricsData, UploadRequest } from '../types';
import { config } from './config.util';

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    // Only allow JSON files
    if (file.mimetype === 'application/json' || path.extname(file.originalname) === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

export { upload };

export async function uploadAndParseFile(req: UploadRequest): Promise<number> {
  const file = req.file;
  if (!file) throw new Error('No file uploaded');

  const filePath = path.resolve(file.path);

  try {
    // Parse JSON file
    const data: MetricsData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Validate data structure
    if (!data || !Array.isArray(data.metrics)) {
      throw new Error('Invalid JSON structure. Expected object with metrics array.');
    }

    // Connect to MongoDB
    const client = new MongoClient(config.mongodb.uri);
    await client.connect();
    const db = client.db(config.mongodb.dbName);
    const collection = db.collection('metrics');

    // Insert data with deduplication
    const bulkOps = data.metrics.map((metric: Metric) => ({
      updateOne: {
        filter: { label: metric.label },
        update: { $set: metric },
        upsert: true
      }
    }));

    await collection.bulkWrite(bulkOps);
    await client.close();

    const recordsProcessed = data.metrics.length;
    console.log(`Successfully processed ${recordsProcessed} metrics`);
    return recordsProcessed;
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  } finally {
    // Clean up uploaded file
    fs.unlinkSync(filePath);
  }
}
