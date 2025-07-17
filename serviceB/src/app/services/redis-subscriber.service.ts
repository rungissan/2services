import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { config } from '../utils/config.util';
import { LoggingService } from './logging.service';

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  private redisSubscriber: Redis;

  constructor(private loggingService: LoggingService) {
    this.redisSubscriber = new Redis({
      host: config.redis.host,
      port: config.redis.port,
    });
  }

  async onModuleInit() {
    await this.subscribeToChannels();
  }

  async onModuleDestroy() {
    await this.redisSubscriber.disconnect();
  }

  private async subscribeToChannels() {
    // Subscribe to all configured channels
    const channels = Object.values(config.redis.channels);
    await this.redisSubscriber.subscribe(...channels);

    this.redisSubscriber.on('message', async (channel, message) => {
      try {
        const eventData = JSON.parse(message);
        await this.handleEvent(channel, eventData);
      } catch (error) {
        console.error('Error processing Redis message:', error);
      }
    });

    console.log(`Subscribed to Redis channels: ${channels.join(', ')}`);
  }

  private async handleEvent(channel: string, eventData: Record<string, unknown>) {
    const logEvent = {
      eventType: channel,
      timestamp: new Date(),
      source: eventData.source || 'unknown',
      filename: eventData.filename,
      metadata: {
        channel,
        ...(eventData.metadata as Record<string, unknown> || {}),
      },
      data: eventData.data,
    };

    await this.loggingService.logEvent(logEvent);
  }
}
