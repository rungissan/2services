import { MongoClient } from 'mongodb';
import { Metric, SearchQuery, SearchResult } from '../types';
import { config } from './config.util';

export async function searchMetrics(query: SearchQuery): Promise<SearchResult> {
  const client = new MongoClient(config.mongodb.uri);

  try {
    await client.connect();
    const db = client.db(config.mongodb.dbName);
    const collection = db.collection('metrics');

    // Build MongoDB query
    const mongoQuery: Record<string, unknown> = {};

    // Text search
    if (query.q) {
      mongoQuery.$text = { $search: query.q };
    }

    // Apply filters
    if (query.filter) {
      Object.assign(mongoQuery, query.filter);
    }

    // Cursor-based pagination
    if (query.cursor) {
      mongoQuery._id = { $gt: query.cursor };
    }

    const limit = query.limit || 20;
    const skip = query.page ? (query.page - 1) * limit : 0;

    // Execute query
    const cursor = collection.find(mongoQuery)
      .skip(skip)
      .limit(limit + 1); // Get one extra to check if there are more results

    const results = await cursor.toArray();
    const hasMore = results.length > limit;

    if (hasMore) {
      results.pop(); // Remove the extra result
    }

    const data: Metric[] = results.map(doc => ({
      label: doc.label,
      value: doc.value
    }));

    const totalCount = await collection.countDocuments(mongoQuery);
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1]._id?.toString() : undefined;

    return {
      data,
      totalCount,
      hasMore,
      nextCursor
    };
  } catch (error) {
    console.error('Error searching metrics:', error);
    throw error;
  } finally {
    await client.close();
  }
}

export async function ensureTextIndex(): Promise<void> {
  const client = new MongoClient(config.mongodb.uri);

  try {
    await client.connect();
    const db = client.db(config.mongodb.dbName);
    const collection = db.collection('metrics');

    // Create text index on label field
    await collection.createIndex({ label: 'text' });
    console.log('Text index created on metrics collection');
  } catch (error) {
    console.error('Error creating text index:', error);
    throw error;
  } finally {
    await client.close();
  }
}
