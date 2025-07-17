import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';
import { getDatabaseConfig } from '../config/database.config';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client!: MongoClient;
  private db!: Db;

  async onModuleInit() {
    const config = getDatabaseConfig();

    this.client = new MongoClient(config.mongodb.connectionString, {
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });

    try {
      await this.client.connect();
      this.db = this.client.db(config.mongodb.database);
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 MongoDB client disconnected');
    }
  }

  getDatabase(): Db {
    return this.db;
  }

  getCollection(name: string): Collection {
    return this.db.collection(name);
  }

  // ServiceA specific collections
  getServiceADataCollection(): Collection {
    return this.db.collection('serviceA_data');
  }

  getServiceALogsCollection(): Collection {
    return this.db.collection('serviceA_logs');
  }

  // ServiceB specific collections
  getServiceBDataCollection(): Collection {
    return this.db.collection('serviceB_data');
  }

  getServiceBLogsCollection(): Collection {
    return this.db.collection('serviceB_logs');
  }

  // Shared collections
  getSharedEventsCollection(): Collection {
    return this.db.collection('shared_events');
  }

  getUserSessionsCollection(): Collection {
    return this.db.collection('user_sessions');
  }

  // Common database operations
  async insertOne(collectionName: string, document: Record<string, unknown>) {
    const collection = this.getCollection(collectionName);
    const result = await collection.insertOne({
      ...document,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  async findOne(collectionName: string, filter: Record<string, unknown>) {
    const collection = this.getCollection(collectionName);
    return await collection.findOne(filter);
  }

  async findMany(collectionName: string, filter: Record<string, unknown>, options?: Record<string, unknown>) {
    const collection = this.getCollection(collectionName);
    return await collection.find(filter, options).toArray();
  }

  async updateOne(collectionName: string, filter: Record<string, unknown>, update: Record<string, unknown>) {
    const collection = this.getCollection(collectionName);
    const result = await collection.updateOne(filter, {
      $set: {
        ...update,
        updatedAt: new Date(),
      },
    });
    return result;
  }

  async deleteOne(collectionName: string, filter: Record<string, unknown>) {
    const collection = this.getCollection(collectionName);
    return await collection.deleteOne(filter);
  }

  async deleteMany(collectionName: string, filter: Record<string, unknown>) {
    const collection = this.getCollection(collectionName);
    return await collection.deleteMany(filter);
  }

  async count(collectionName: string, filter: Record<string, unknown>): Promise<number> {
    const collection = this.getCollection(collectionName);
    return await collection.countDocuments(filter);
  }

  async aggregate(collectionName: string, pipeline: Record<string, unknown>[]) {
    const collection = this.getCollection(collectionName);
    return await collection.aggregate(pipeline).toArray();
  }

  // Utility methods for common operations
  async logEvent(serviceName: string, eventType: string, data: Record<string, unknown>): Promise<void> {
    await this.insertOne('shared_events', {
      serviceName,
      eventType,
      data,
      timestamp: new Date(),
    });
  }

  async getRecentEvents(serviceName?: string, limit = 100) {
    const filter = serviceName ? { serviceName } : {};
    return await this.findMany('shared_events', filter, {
      sort: { timestamp: -1 },
      limit,
    });
  }

  async createUserSession(userId: string, sessionData: Record<string, unknown>): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.insertOne('user_sessions', {
      userId,
      sessionId,
      sessionData,
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    return sessionId;
  }

  async getUserSession(sessionId: string) {
    return await this.findOne('user_sessions', {
      sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  async invalidateUserSession(sessionId: string): Promise<void> {
    await this.updateOne('user_sessions', { sessionId }, { isActive: false });
  }
}
