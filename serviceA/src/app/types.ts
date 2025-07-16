// Type definitions for the service
export interface Metric {
  label: string;
  value: number;
}

export interface MetricsData {
  metrics: Metric[];
}

export interface EventPayload {
  timestamp: number;
  event: string;
  source: string;
  filename?: string;
  metrics?: Metric[];
}

export interface SearchQuery {
  q?: string;
  filter?: Record<string, string | number | boolean>;
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SearchResult {
  data: Metric[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface UploadRequest {
  file: Express.Multer.File;
}
