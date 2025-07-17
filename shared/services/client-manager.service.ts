import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppConfig } from '../config/app.config';
import { MongoService } from './mongo.service';
import { RedisService } from './redis.service';

/**
 * Centralized client manager for all database and cache connections
 * This ensures proper initialization and cleanup of all clients
 */
@Injectable()
export class ClientManagerService implements OnModuleInit, OnModuleDestroy {
  private mongoService!: MongoService;
  private redisService!: RedisService;

  constructor(private config: AppConfig) {}

  async onModuleInit() {
    console.log(`🚀 Initializing clients for ${this.config.service.name}...`);

    // Initialize MongoDB
    this.mongoService = new MongoService();
    await this.mongoService.onModuleInit();

    // Initialize Redis
    this.redisService = new RedisService();
    await this.redisService.onModuleInit();

    console.log(`✅ All clients initialized for ${this.config.service.name}`);
  }

  async onModuleDestroy() {
    console.log(`🔌 Shutting down clients for ${this.config.service.name}...`);

    try {
      if (this.mongoService) {
        await this.mongoService.onModuleDestroy();
      }
    } catch (error) {
      console.warn('Warning: Error closing MongoDB connection:', error);
    }

    try {
      if (this.redisService) {
        await this.redisService.onModuleDestroy();
      }
    } catch (error) {
      console.warn('Warning: Error closing Redis connection:', error);
    }

    console.log(`💀 Clients shutdown complete for ${this.config.service.name}`);
  }

  // Getters for accessing the services
  getMongoService(): MongoService {
    if (!this.mongoService) {
      throw new Error('MongoDB service not initialized. Call onModuleInit first.');
    }
    return this.mongoService;
  }

  getRedisService(): RedisService {
    if (!this.redisService) {
      throw new Error('Redis service not initialized. Call onModuleInit first.');
    }
    return this.redisService;
  }

  // Health check methods
  async isHealthy(): Promise<{ mongo: boolean; redis: boolean }> {
    try {
      const mongoHealth = await this.checkMongoHealth();
      const redisHealth = await this.checkRedisHealth();

      return {
        mongo: mongoHealth,
        redis: redisHealth
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return { mongo: false, redis: false };
    }
  }

  private async checkMongoHealth(): Promise<boolean> {
    try {
      // Simple ping to check if MongoDB is responsive
      await this.mongoService.getSharedEventsCollection().findOne({}, { limit: 1 });
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      // Simple ping to check if Redis is responsive
      await this.redisService.set('health_check', 'ok', 1);
      const result = await this.redisService.get('health_check');
      return result === 'ok';
    } catch {
      return false;
    }
  }
}
