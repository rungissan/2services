# Service B - Logger & Reporter

Service B is responsible for logging events from Service A and generating reports.

## Features

### 1. Event Subscription & Logging
- Subscribes to Redis channels from Service A
- Logs received events into MongoDB with full metadata
- Stores time-series data for validation and reporting

### 2. Log Query API
- REST endpoints to query logs based on:
  - Event type
  - Date/time range
  - Source or filename
- Supports pagination and sorting

### 3. PDF Report Generation
- Generates PDF reports using time-series data
- Uses RedisTimeSeries (TS.RANGE/TS.MRANGE) to fetch metrics
- Visualizes data with charts and summaries
- Returns reports as downloadable PDFs

## API Endpoints

### Logs API
- `GET /logs` - Query logs with filters
- `GET /logs/event-types` - Get available event types
- `GET /logs/sources` - Get available sources

### Reports API
- `POST /reports/generate` - Generate a new report
- `GET /reports/download/:filename` - Download generated report

## Configuration

The service uses the following configuration:

```typescript
export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'serviceB'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    channels: ['file-upload', 'data-fetch', 'search-query']
  },
  pdf: {
    outputPath: './reports',
    maxReportSize: 50 * 1024 * 1024 // 50MB
  }
};
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - MongoDB database name
- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build

# Run tests
npm run test
```

## Docker

```bash
# Build Docker image
nx run serviceB:docker-build

# Run with Docker Compose
docker-compose up serviceB
```
