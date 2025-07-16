import { ObjectId } from 'mongodb';

export interface BaseDocument {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceAData extends BaseDocument {
  userId: string;
  data: Record<string, unknown>;
  status: 'active' | 'inactive' | 'pending';
}

export interface ServiceBData extends BaseDocument {
  userId: string;
  data: Record<string, unknown>;
  status: 'active' | 'inactive' | 'pending';
}

export interface LogEntry extends BaseDocument {
  serviceName: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SharedEvent extends BaseDocument {
  serviceName: string;
  eventType: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface UserSession extends BaseDocument {
  userId: string;
  sessionId: string;
  sessionData: Record<string, unknown>;
  isActive: boolean;
  expiresAt: Date;
}

export type MongoFilter = Record<string, unknown>;
export type MongoUpdate = Record<string, unknown>;
export type MongoOptions = Record<string, unknown>;
export type MongoPipeline = Record<string, unknown>[];
export type MongoDocument = Record<string, unknown>;
