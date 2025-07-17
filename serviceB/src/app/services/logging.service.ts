import { Injectable } from '@nestjs/common';
import { MongoService } from '@two-services/shared';
import { LogEvent, LogQuery, LogQueryResult } from './types';

@Injectable()
export class LoggingService {
  constructor(private mongoService: MongoService) {}

  async onModuleInit() {
    console.log('LoggingService initialized');
    // Create indexes for better query performance
    await this.createIndexes();
  }

  async onModuleDestroy() {
    console.log('LoggingService destroyed');
  }

  private async createIndexes() {
    // The shared MongoService handles index creation
    // We can extend it later if needed
  }

  async logEvent(event: LogEvent): Promise<void> {
    try {
      await this.mongoService.insertOne('events', { ...event });
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
        this.mongoService.findMany('events', mongoQuery, {
          sort,
          skip,
          limit
        }),
        this.mongoService.count('events', mongoQuery)
      ]);

      return {
        events: events as LogEvent[],
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
      return await this.mongoService.findMany('events', {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }, {
        sort: { timestamp: -1 }
      }) as LogEvent[];
    } catch (error) {
      console.error('Error getting events by date range:', error);
      throw error;
    }
  }
}
