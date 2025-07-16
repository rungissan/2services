# PDF Generator Service Integration

## Overview

The PDF Generator Service is a Go-based microservice that generates PDF reports from Redis TimeSeries data using gRPC. It integrates with the existing NestJS microservices architecture.

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Service A         │    │   Service B         │    │  PDF Generator      │
│   (Data Ingestion)  │    │   (Logging)         │    │  (Go + gRPC)        │
│                     │    │                     │    │                     │
│   - File Upload     │    │   - Event Logger    │    │   - PDF Generation  │
│   - Stream Data     │    │   - Log Query API   │───▶│   - Chart Creation  │
│   - Search API      │    │   - Report API      │    │   - Redis TS Query  │
│   - Redis Events    │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Redis Pub/Sub     │    │   MongoDB           │    │  Redis TimeSeries   │
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## Features

### PDF Generator Service
- **gRPC API**: High-performance gRPC service for PDF generation
- **Redis TimeSeries Integration**: Fetches time-series data from Redis
- **PDF Generation**: Creates PDF reports with charts and statistics
- **Chart Generation**: Generates line charts from time-series data
- **Dockerized**: Fully containerized with Docker support

### NestJS Integration
- **gRPC Client**: NestJS client for communicating with PDF generator
- **REST API**: HTTP endpoints for PDF generation in Service B
- **Async Processing**: Support for both sync and async PDF generation
- **Error Handling**: Comprehensive error handling and logging

## API Endpoints

### Service B - PDF Report Endpoints

#### Generate PDF Report (Synchronous)
```bash
POST /reports/generate
Content-Type: application/json

{
  "reportType": "daily",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-02T00:00:00Z",
  "metrics": ["temperature", "humidity"],
  "filters": {
    "source": "sensor1",
    "location": "warehouse"
  }
}
```

Response: PDF file download

#### Generate PDF Report (Asynchronous)
```bash
POST /reports/generate-async
Content-Type: application/json

{
  "reportType": "weekly",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-07T00:00:00Z",
  "metrics": ["temperature", "humidity", "pressure"],
  "filters": {
    "source": "sensor1"
  }
}
```

Response:
```json
{
  "reportId": "report_1640995200000",
  "filename": "report_weekly_20240101_120000.pdf",
  "message": "Report generation completed",
  "status": "COMPLETED"
}
```

#### Get Report Status
```bash
GET /reports/status/{reportId}
```

Response:
```json
{
  "reportId": "report_1640995200000",
  "status": "COMPLETED",
  "errorMessage": "",
  "filename": "report_weekly_20240101_120000.pdf"
}
```

## Setup and Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- Go 1.21+ (for PDF service development)

### Quick Start

1. **Clone and build the entire system:**
```bash
git clone <repository-url>
cd two-services
docker-compose up --build
```

2. **Services will be available at:**
   - Service A: http://localhost:3001
   - Service B: http://localhost:3002
   - PDF Generator: grpc://localhost:50051
   - MongoDB: mongodb://localhost:27017
   - Redis: localhost:6379
   - Redis TimeSeries: localhost:6380
   - Redis Pub/Sub: localhost:6381

### Development Setup

1. **Install dependencies:**
```bash
# Install Node.js dependencies
npm install

# Install Go dependencies for PDF generator
cd pdf-generator
go mod tidy
./setup.sh
```

2. **Start services individually:**
```bash
# Start infrastructure
docker-compose up mongodb redis redis-timeseries redis-pubsub

# Start PDF generator
cd pdf-generator
go run main.go

# Start Service A
cd serviceA
npm run start:dev

# Start Service B
cd serviceB
npm run start:dev
```

## Configuration

### Environment Variables

#### Service A & B
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `REDIS_TIMESERIES_URL`: Redis TimeSeries connection string
- `REDIS_PUBSUB_URL`: Redis Pub/Sub connection string
- `PDF_GENERATOR_ADDR`: PDF generator gRPC address (default: localhost:50051)

#### PDF Generator Service
- `GRPC_PORT`: gRPC server port (default: 50051)
- `REDIS_TIMESERIES_ADDR`: Redis TimeSeries address (default: localhost:6380)
- `REDIS_PASSWORD`: Redis password (default: password)

### Docker Compose Configuration

The system includes two Docker Compose files:
- `docker-compose.yml`: Production configuration
- `docker-compose.dev.yml`: Development configuration with hot reload

## Usage Examples

### 1. Upload Data and Generate Report

```bash
# 1. Upload data via Service A
curl -X POST http://localhost:3001/api/upload \
  -F "file=@temperature-data.xlsx"

# 2. Generate PDF report via Service B
curl -X POST http://localhost:3002/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "daily",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-02T00:00:00Z",
    "metrics": ["temperature", "humidity"],
    "filters": {"source": "file_upload"}
  }' \
  --output report.pdf
```

### 2. Search Data and Generate Custom Report

```bash
# 1. Search for specific data
curl -X GET "http://localhost:3001/api/search?query=temperature&limit=100"

# 2. Generate custom report with specific filters
curl -X POST http://localhost:3002/reports/generate-async \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "custom",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-31T00:00:00Z",
    "metrics": ["temperature", "humidity", "pressure"],
    "filters": {
      "source": "api_stream",
      "location": "warehouse",
      "sensor_type": "environmental"
    }
  }'
```

### 3. Monitor Report Generation

```bash
# Check report status
curl -X GET http://localhost:3002/reports/status/report_1640995200000
```

## Data Flow

1. **Data Ingestion (Service A)**:
   - Receives streamed data or file uploads
   - Stores data in MongoDB
   - Publishes events to Redis Pub/Sub
   - Writes time-series metrics to Redis TimeSeries

2. **Event Processing (Service B)**:
   - Subscribes to Redis events
   - Logs events to MongoDB
   - Provides API for log queries

3. **Report Generation (PDF Generator)**:
   - Receives gRPC requests from Service B
   - Queries Redis TimeSeries for metrics
   - Generates charts and statistics
   - Creates PDF reports with visualizations

## Redis TimeSeries Schema

The system uses the following Redis TimeSeries key patterns:

| Pattern | Example | Description |
|---------|---------|-------------|
| `ts:metric:source:filename` | `ts:temperature:sensor1:data.xlsx` | Individual metric series |
| `ts:metric:source:*` | `ts:temperature:sensor1:*` | All files from a source |
| `ts:*:source:filename` | `ts:*:sensor1:data.xlsx` | All metrics from a file |

### Labels Used:
- `metric`: temperature, humidity, pressure, etc.
- `source`: file_upload, api_stream, sensor1, etc.
- `filename`: Original filename or stream identifier
- `unit`: celsius, fahrenheit, percentage, etc.
- `location`: warehouse, office, factory, etc.

## Testing

### Unit Tests
```bash
# Test NestJS services
npm run test

# Test Go PDF generator
cd pdf-generator
go test ./...
```

### Integration Tests
```bash
# Test end-to-end workflows
npm run test:e2e
```

### Manual Testing with cURL
```bash
# Test PDF generation
curl -X POST http://localhost:3002/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "test",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-02T00:00:00Z",
    "metrics": ["temperature"],
    "filters": {}
  }' \
  --output test-report.pdf
```

## Monitoring and Logging

### Service Logs
- **Service A**: Data ingestion, file processing, API requests
- **Service B**: Event subscription, log queries, report requests
- **PDF Generator**: gRPC requests, Redis operations, PDF generation

### Health Checks
All services include health check endpoints:
- Service A: `GET /health`
- Service B: `GET /health`
- PDF Generator: gRPC health check

### Metrics
- Request counts and durations
- Redis operation metrics
- PDF generation statistics
- Error rates and types

## Troubleshooting

### Common Issues

1. **PDF Generation Fails**:
   - Check Redis TimeSeries connection
   - Verify time range has data
   - Check metric names and filters

2. **gRPC Connection Issues**:
   - Ensure PDF generator service is running
   - Check network connectivity
   - Verify gRPC port configuration

3. **Empty Reports**:
   - Check if data exists in the time range
   - Verify metric names match Redis keys
   - Check filter criteria

### Debug Commands

```bash
# Check Redis TimeSeries data
redis-cli -h localhost -p 6380 -a password
TS.RANGE ts:temperature:sensor1:data.xlsx 0 -1

# Check gRPC service
grpcurl -plaintext localhost:50051 list

# Check container logs
docker logs two-services-pdf-generator
docker logs two-services-serviceb
```

## Future Enhancements

### Planned Features
- [ ] Real-time report streaming
- [ ] Multiple chart types (bar, pie, scatter)
- [ ] Custom PDF templates
- [ ] Report scheduling
- [ ] Email delivery
- [ ] Authentication and authorization
- [ ] Report caching
- [ ] Batch report generation

### Performance Optimizations
- [ ] Connection pooling for gRPC
- [ ] Redis clustering support
- [ ] Async report generation queue
- [ ] PDF compression
- [ ] Caching of frequently generated reports

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

[Your License Here]
