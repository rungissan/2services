import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DataFetchEvent, FileUploadEvent, SearchQueryEvent } from './common-types';
import { config } from './config';

@Injectable()
export class EventPublisherService {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
    });
  }

  async onModuleDestroy() {
    await this.redisClient.disconnect();
  }

  async publishFileUploadEvent(event: Omit<FileUploadEvent, 'eventType' | 'timestamp'>): Promise<void> {
    const fullEvent: FileUploadEvent = {
      ...event,
      eventType: 'file-upload',
      timestamp: new Date()
    };

    await this.publishEvent(config.redis.channels.fileUpload, fullEvent);
  }

  async publishDataFetchEvent(event: Omit<DataFetchEvent, 'eventType' | 'timestamp'>): Promise<void> {
    const fullEvent: DataFetchEvent = {
      ...event,
      eventType: 'data-fetch',
      timestamp: new Date()
    };

    await this.publishEvent(config.redis.channels.dataFetch, fullEvent);
  }

  async publishSearchQueryEvent(event: Omit<SearchQueryEvent, 'eventType' | 'timestamp'>): Promise<void> {
    const fullEvent: SearchQueryEvent = {
      ...event,
      eventType: 'search-query',
      timestamp: new Date()
    };

    await this.publishEvent(config.redis.channels.searchQuery, fullEvent);
  }

  private async publishEvent(channel: string, event: FileUploadEvent | DataFetchEvent | SearchQueryEvent): Promise<void> {
    try {
      await this.redisClient.publish(channel, JSON.stringify(event));
      console.log(`Published event to ${channel}:`, event.eventType);
    } catch (error) {
      console.error(`Failed to publish event to ${channel}:`, error);
      throw error;
    }
  }
}
