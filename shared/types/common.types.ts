import { BaseDocument } from './database.types';

// Event types for Redis pub/sub
export interface RedisEvent {
  eventType: string;
  timestamp: Date;
  source: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface FileUploadEvent extends RedisEvent {
  eventType: 'file-upload';
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadPath: string;
}

export interface DataFetchEvent extends RedisEvent {
  eventType: 'data-fetch';
  url: string;
  status: 'success' | 'error';
  recordCount?: number;
  errorMessage?: string;
}

export interface SearchQueryEvent extends RedisEvent {
  eventType: 'search-query';
  query: string;
  resultsCount: number;
  executionTime: number;
}

// Log entry for Service B
export interface LogEvent extends BaseDocument {
  eventType: string;
  timestamp: Date;
  source: string;
  filename?: string;
  metadata: Record<string, unknown>;
  data?: Record<string, unknown>;
}

// Common query interfaces
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeQuery {
  startDate?: Date;
  endDate?: Date;
}

export interface LogQuery extends PaginationQuery, DateRangeQuery {
  eventType?: string;
  source?: string;
  filename?: string;
}

export interface LogQueryResult {
  events: LogEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Report types
export interface ReportRequest extends DateRangeQuery {
  metrics?: string[];
  format?: 'pdf' | 'json' | 'csv';
  title?: string;
}

export interface ReportResponse {
  id: string;
  status: 'generating' | 'completed' | 'failed';
  filePath?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// File upload types
export interface FileUploadRequest {
  file: Express.Multer.File;
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadPath: string;
  uploadedAt: Date;
}

// Search types
export interface SearchRequest {
  query: string;
  filters?: Record<string, unknown>;
  options?: {
    fuzzy?: boolean;
    limit?: number;
    offset?: number;
  };
}

export interface SearchResponse {
  results: Array<Record<string, unknown>>;
  total: number;
  executionTime: number;
  query: string;
}
