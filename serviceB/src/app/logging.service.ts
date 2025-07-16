import { Injectable } from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';
import { config } from './config';
import { LogEvent, LogQuery, LogQueryResult } from './types';

@Injectable()
export class LoggingService {
  private client: MongoClient;
  private db: Db;
  private collection: Collection<LogEvent>;

  constructor() {
    this.client = new MongoClient(config.mongodb.uri);
    this.db = this.client.db(config.mongodb.dbName);
    this.collection = this.db.collection<LogEvent>('events');
  }

  async onModuleInit() {
    await this.client.connect();
    console.log('Connected to MongoDB for logging');

    // Create indexes for better query performance
    await this.createIndexes();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  private async createIndexes() {
    await this.collection.createIndex({ timestamp: -1 });
    await this.collection.createIndex({ eventType: 1 });
    await this.collection.createIndex({ source: 1 });
    await this.collection.createIndex({ filename: 1 });
    await this.collection.createIndex({ eventType: 1, timestamp: -1 });
  }

  async logEvent(event: LogEvent): Promise<void> {
    try {
      await this.collection.insertOne(event);
      console.log(`Logged event: ${event.eventType} from ${event.source}`);
    } catch (error) {
      console.error('Error logging event:', error);
      throw error;
    }
  }

  async queryLogs(query: LogQuery): Promise<LogQueryResult> {
    const {
      eventType,
      startDate,
      endDate,
      source,
      filename,
      page = 1,
      limit = 100,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = query;

    // Build MongoDB query
    const mongoQuery: Record<string, unknown> = {};

    if (eventType) {
      mongoQuery.eventType = eventType;
    }

    if (startDate || endDate) {
      const timestampQuery: Record<string, Date> = {};
      if (startDate) {
        timestampQuery.$gte = startDate;
      }
      if (endDate) {
        timestampQuery.$lte = endDate;
      }
      mongoQuery.timestamp = timestampQuery;
    }

    if (source) {
      mongoQuery.source = source;
    }

    if (filename) {
      mongoQuery.filename = filename;
    }

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as const;

    // Calculate pagination
    const skip = (page - 1) * limit;

    try {
      const [events, total] = await Promise.all([
        this.collection
          .find(mongoQuery)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.collection.countDocuments(mongoQuery)
      ]);

      return {
        events,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error querying logs:', error);
      throw error;
    }
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<LogEvent[]> {
    try {
      return await this.collection
        .find({
          timestamp: {
            $gte: startDate,
            $lte: endDate
          }
        })
        .sort({ timestamp: -1 })
        .toArray();
    } catch (error) {
      console.error('Error getting events by date range:', error);
      throw error;
    }
  }
}
