# PDF Generator Service

A Go-based microservice that generates PDF reports from Redis TimeSeries data using gRPC.

## Features

- **gRPC API**: High-performance gRPC service for PDF generation
- **Redis TimeSeries Integration**: Fetches time-series data from Redis
- **PDF Generation**: Creates PDF reports with charts and statistics
- **Chart Generation**: Generates line charts from time-series data
- **Dockerized**: Fully containerized with Docker support
- **Health Checks**: Built-in health check endpoints

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Service A/B       │    │  PDF Generator      │    │  Redis TimeSeries   │
│   (NestJS)          │───▶│  (Go + gRPC)        │───▶│                     │
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## API

### GenerateReport

Generates a PDF report from Redis TimeSeries data.

**Request:**
```proto
message GenerateReportRequest {
    string report_type = 1;
    string start_time = 2;    // RFC3339 format
    string end_time = 3;      // RFC3339 format
    repeated string metrics = 4;
    map<string, string> filters = 5;
}
```

**Response:**
```proto
message GenerateReportResponse {
    string report_id = 1;
    bytes pdf_data = 2;
    string filename = 3;
    bool success = 4;
    string error_message = 5;
}
```

### GetReportStatus

Gets the status of a report generation.

**Request:**
```proto
message GetReportStatusRequest {
    string report_id = 1;
}
```

**Response:**
```proto
message GetReportStatusResponse {
    string report_id = 1;
    ReportStatus status = 2;
    string error_message = 3;
    string filename = 4;
}
```

## Setup

### Prerequisites

- Go 1.21+
- Protocol Buffers compiler (`protoc`)
- Redis with TimeSeries module

### Installation

1. Run the setup script:
```bash
./setup.sh
```

2. Or manually:
```bash
# Install protobuf plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate protobuf files
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/pdf_generator.proto

# Download dependencies
go mod tidy
```

### Running

#### Local Development

```bash
# Set environment variables
export GRPC_PORT=50051
export REDIS_TIMESERIES_ADDR=localhost:6380
export REDIS_PASSWORD=password

# Run the service
go run main.go
```

#### Docker

```bash
# Build the image
docker build -t pdf-generator .

# Run the container
docker run -p 50051:50051 \
  -e REDIS_TIMESERIES_ADDR=redis-timeseries:6379 \
  -e REDIS_PASSWORD=password \
  pdf-generator
```

## Configuration

The service is configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GRPC_PORT` | `50051` | gRPC server port |
| `REDIS_TIMESERIES_ADDR` | `localhost:6380` | Redis TimeSeries address |
| `REDIS_PASSWORD` | `password` | Redis password |

## Usage Examples

### Using grpcurl

```bash
# Generate a report
grpcurl -plaintext -d '{
  "report_type": "daily",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-02T00:00:00Z",
  "metrics": ["temperature", "humidity"],
  "filters": {"source": "sensor1"}
}' localhost:50051 pdfgenerator.PDFGeneratorService/GenerateReport

# Get report status
grpcurl -plaintext -d '{
  "report_id": "report_123"
}' localhost:50051 pdfgenerator.PDFGeneratorService/GetReportStatus
```

### Go Client Example

```go
package main

import (
    "context"
    "log"
    "pdf-generator/proto"
    "google.golang.org/grpc"
)

func main() {
    conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    client := proto.NewPDFGeneratorServiceClient(conn)
    
    resp, err := client.GenerateReport(context.Background(), &proto.GenerateReportRequest{
        ReportType: "daily",
        StartTime:  "2024-01-01T00:00:00Z",
        EndTime:    "2024-01-02T00:00:00Z",
        Metrics:    []string{"temperature", "humidity"},
        Filters:    map[string]string{"source": "sensor1"},
    })
    
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Report generated: %s", resp.Filename)
}
```

## Integration with NestJS Services

### Service B Integration

Add this to your NestJS service to call the PDF generator:

```typescript
import { Injectable } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

@Injectable()
export class PDFGeneratorClient {
  private client: any;

  constructor() {
    const packageDefinition = protoLoader.loadSync('path/to/pdf_generator.proto');
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const PDFGeneratorService = protoDescriptor.pdfgenerator.PDFGeneratorService;

    this.client = new PDFGeneratorService(
      'pdf-generator:50051',
      grpc.credentials.createInsecure()
    );
  }

  async generateReport(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.generateReport(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}
```

## Project Structure

```
pdf-generator/
├── main.go                 # Main application entry point
├── go.mod                  # Go module file
├── Dockerfile             # Docker configuration
├── setup.sh               # Setup script
├── proto/
│   └── pdf_generator.proto # Protocol buffer definitions
├── internal/
│   ├── service/
│   │   └── pdf_service.go  # PDF generation service
│   └── redis/
│       └── client.go       # Redis TimeSeries client
└── pkg/                   # Shared packages (future use)
```

## Dependencies

- `github.com/go-pdf/fpdf` - PDF generation
- `github.com/go-redis/redis/v8` - Redis client
- `github.com/wcharczuk/go-chart/v2` - Chart generation
- `google.golang.org/grpc` - gRPC framework
- `google.golang.org/protobuf` - Protocol buffers

## Development

### Testing

```bash
# Run tests
go test ./...

# Run with coverage
go test -cover ./...
```

### Linting

```bash
# Install golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Run linter
golangci-lint run
```

## Monitoring

The service includes built-in health checks and can be monitored via:

- gRPC health checks
- Application logs
- Redis connection status

## Troubleshooting

### Common Issues

1. **protoc not found**: Install Protocol Buffers compiler
2. **Redis connection failed**: Check Redis TimeSeries connection and credentials
3. **PDF generation failed**: Verify time-series data format and availability

### Logs

The service logs important events including:
- Service startup
- gRPC requests
- Redis operations
- PDF generation status
- Errors and warnings

## Future Enhancements

- [ ] Add authentication and authorization
- [ ] Implement report caching
- [ ] Add more chart types (bar, pie, etc.)
- [ ] Support for custom PDF templates
- [ ] Metrics and monitoring endpoints
- [ ] Batch report generation
- [ ] Real-time report streaming
