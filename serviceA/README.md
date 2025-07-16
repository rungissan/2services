# Service A - Data Processor

This service implements the data processing functionality as specified in the requirements document. It handles JSON file processing, data storage, search functionality, and event publishing.

## Features

### 1. Streamed Data Fetching & File Saving
- Fetches large datasets from public APIs using Node.js streams
- Saves data as JSON files with proper stream handling including backpressure and error handling
- Endpoint: `POST /fetch-data`

### 2. File Upload & Parsing
- Accepts JSON file uploads
- Parses uploaded content programmatically
- Inserts parsed data into MongoDB using bulk operations
- Includes error handling, validation, and deduplication
- Endpoint: `POST /upload`

### 3. Search API
- Provides REST endpoint to search MongoDB data
- Enables text indexing, filtering, and pagination
- Uses cursor-based pagination for large datasets
- Endpoint: `GET /search`

### 4. Time-Series Event Publication (Redis)
- Publishes all API actions/events via Redis Pub/Sub
- Pushes associated metrics to Redis TimeSeries using `TS.ADD`
- Structures metrics with labels (metric, source, file, service)

## API Endpoints

### GET /
Basic health check endpoint.

### POST /fetch-data
Fetches data from the public API and saves it as JSON.

**Response:**
```json
{
  "message": "Data fetched and saved successfully"
}
```

### POST /upload
Upload a JSON file for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field containing the JSON file

**Response:**
```json
{
  "message": "File uploaded and processed successfully"
}
```

### GET /search
Search for metrics in the database.

**Query Parameters:**
- `q` (optional): Text search query
- `filter` (optional): Additional filters as JSON
- `page` (optional): Page number for pagination
- `limit` (optional): Number of results per page (default: 20)
- `cursor` (optional): Cursor for cursor-based pagination

**Response:**
```json
{
  "data": [
    {
      "label": "temperature",
      "value": 32.5
    }
  ],
  "totalCount": 100,
  "hasMore": true,
  "nextCursor": "cursor_string"
}
```

### POST /init-index
Initialize text search index on the metrics collection.

**Response:**
```json
{
  "message": "Text index created successfully"
}
```

## Data Format

The service expects JSON files with the following structure:

```json
{
  "metrics": [
    {
      "label": "temperature",
      "value": 32.5
    },
    {
      "label": "humidity",
      "value": 85
    }
  ]
}
```

## Configuration

The service uses the following configuration:

### Environment Variables
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017`)
- `MONGODB_DB_NAME`: Database name (default: `serviceA`)
- `REDIS_HOST`: Redis host (default: `localhost`)
- `REDIS_PORT`: Redis port (default: `6379`)

### File Upload Limits
- Maximum file size: 10MB
- Allowed file types: JSON only

## Events

The service publishes the following events to Redis:

### Event Structure
```json
{
  "timestamp": 1721070000000,
  "event": "insert_complete",
  "source": "file_upload",
  "filename": "temperature-data-2025.json",
  "metrics": [
    {
      "label": "temperature",
      "value": 32.5
    }
  ]
}
```

### Event Types
- `fetch_complete`: Data fetched from public API
- `upload_complete`: File uploaded and processed
- `search_complete`: Search operation completed

## Dependencies

- **NestJS**: Web framework
- **MongoDB**: Database for storing metrics
- **Redis**: Pub/Sub messaging and TimeSeries storage
- **ioredis**: Redis client
- **multer**: File upload handling
- **axios**: HTTP client for API calls

## Data Source

The service fetches data from: `https://www.ura.org.ua/timeseries_data_quoter.json`
