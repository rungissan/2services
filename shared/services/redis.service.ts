import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { getDatabaseConfig } from '../config/database.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;
  private redisTimeSeriesClient!: Redis;
  private redisPubSubClient!: Redis;
  private redisSubscriberClient!: Redis;

  async onModuleInit() {
    const config = getDatabaseConfig();

    try {
      // Main Redis client
      this.redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Redis TimeSeries client
      this.redisTimeSeriesClient = new Redis({
        host: config.redisTimeSeries.host,
        port: config.redisTimeSeries.port,
        db: config.redisTimeSeries.db,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Redis Pub/Sub client (publisher)
      this.redisPubSubClient = new Redis({
        host: config.redisPubSub.host,
        port: config.redisPubSub.port,
        db: config.redisPubSub.db,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Redis Pub/Sub client (subscriber)
      this.redisSubscriberClient = new Redis({
        host: config.redisPubSub.host,
        port: config.redisPubSub.port,
        db: config.redisPubSub.db,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Add error handlers to prevent unhandled error events
      [this.redisClient, this.redisTimeSeriesClient, this.redisPubSubClient, this.redisSubscriberClient].forEach((client, index) => {
        const clientNames = ['main', 'timeseries', 'pubsub', 'subscriber'];

        // Handle all types of errors
        client.on('error', (error) => {
          console.warn(`⚠️ Redis ${clientNames[index]} client error:`, error.message);
        });

        client.on('connect', () => {
          console.log(`✅ Redis ${clientNames[index]} client connected`);
        });

        client.on('ready', () => {
          console.log(`🚀 Redis ${clientNames[index]} client ready`);
        });

        client.on('close', () => {
          console.log(`🔌 Redis ${clientNames[index]} client connection closed`);
        });

        client.on('reconnecting', () => {
          console.log(`🔄 Redis ${clientNames[index]} client reconnecting...`);
        });

        // Handle node-specific errors
        client.on('node error', (error) => {
          console.warn(`⚠️ Redis ${clientNames[index]} node error:`, error.message);
        });
      });

      // Test connections with proper error handling
      try {
        await this.redisClient.ping();
        console.log('✅ Redis main client ping successful');
      } catch (error) {
        console.error('❌ Redis main client ping failed:', error instanceof Error ? error.message : error);
      }

      try {
        await this.redisTimeSeriesClient.ping();
        console.log('✅ Redis timeseries client ping successful');
      } catch (error) {
        console.error('❌ Redis timeseries client ping failed:', error instanceof Error ? error.message : error);
      }

      try {
        await this.redisPubSubClient.ping();
        console.log('✅ Redis pubsub client ping successful');
      } catch (error) {
        console.error('❌ Redis pubsub client ping failed:', error instanceof Error ? error.message : error);
      }

      try {
        await this.redisSubscriberClient.ping();
        console.log('✅ Redis subscriber client ping successful');
      } catch (error) {
        console.error('❌ Redis subscriber client ping failed:', error instanceof Error ? error.message : error);
      }

      console.log('✅ Redis clients initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Redis clients:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.redisClient?.quit();
    await this.redisTimeSeriesClient?.quit();
    await this.redisPubSubClient?.quit();
    await this.redisSubscriberClient?.quit();
    console.log('🔌 Redis clients disconnected');
  }

  // Main Redis operations
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setex(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redisClient.exists(key)) === 1;
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.redisClient.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.redisClient.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }

  // TimeSeries operations
  async addTimeSeries(key: string, timestamp: number, value: number): Promise<void> {
    await this.redisTimeSeriesClient.call('TS.ADD', key, timestamp, value);
  }

  async getTimeSeriesRange(key: string, fromTimestamp: number, toTimestamp: number): Promise<Array<[number, number]>> {
    const result = await this.redisTimeSeriesClient.call('TS.RANGE', key, fromTimestamp, toTimestamp);
    return result as Array<[number, number]>;
  }

  async createTimeSeries(key: string, retention?: number): Promise<void> {
    const args = ['TS.CREATE', key];
    if (retention) {
      args.push('RETENTION', retention.toString());
    }
    await this.redisTimeSeriesClient.call('TS.CREATE', key, ...(retention ? ['RETENTION', retention.toString()] : []));
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<void> {
    await this.redisPubSubClient.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.redisSubscriberClient.subscribe(channel);
    this.redisSubscriberClient.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.redisSubscriberClient.unsubscribe(channel);
  }

  // Pattern-based subscription
  async psubscribe(pattern: string, callback: (channel: string, message: string) => void): Promise<void> {
    await this.redisSubscriberClient.psubscribe(pattern);
    this.redisSubscriberClient.on('pmessage', (receivedPattern, channel, message) => {
      if (receivedPattern === pattern) {
        callback(channel, message);
      }
    });
  }

  async punsubscribe(pattern: string): Promise<void> {
    await this.redisSubscriberClient.punsubscribe(pattern);
  }

  // Get raw clients for advanced operations
  getRedisClient(): Redis {
    return this.redisClient;
  }

  getTimeSeriesClient(): Redis {
    return this.redisTimeSeriesClient;
  }

  getPubSubClient(): Redis {
    return this.redisPubSubClient;
  }

  getSubscriberClient(): Redis {
    return this.redisSubscriberClient;
  }
}
