# Two Services - NestJS Microservices with Docker & PDF Generator

This project contains a complete microservices architecture with NestJS services, Go PDF generator, and comprehensive data infrastructure including MongoDB, Redis, and Redis TimeSeries.

## Architecture

- **ServiceA**: NestJS microservice for data ingestion and processing (port 3001)
- **ServiceB**: NestJS microservice for logging and reporting (port 3002)
- **PDF Generator**: Go gRPC service for generating PDF reports (port 50051)
- **MongoDB**: Document database for persistent data storage (port 27017)
- **Redis**: In-memory cache and session storage (port 6379)
- **Redis TimeSeries**: Time-series data storage (port 6380)
- **Redis Pub/Sub**: Message queuing and real-time communication (port 6381)
- **Shared Libraries**: Common utilities and gRPC clients
- **Docker Compose**: Container orchestration

## Data Flow

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

## Data Infrastructure

### MongoDB (Port 27017)
- **Purpose**: Primary data storage for both services
- **Collections**:
  - `serviceA_data`, `serviceA_logs`
  - `serviceB_data`, `serviceB_logs`
  - `shared_events`, `user_sessions`
- **Credentials**: admin/password (root), app-user/app-password (application)

### Redis (Port 6379)
- **Purpose**: Caching and session storage
- **Configuration**: Persistence enabled with AOF and RDB
- **Password**: password

### Redis TimeSeries (Port 6380)
- **Purpose**: Time-series data storage and analytics
- **Features**: Built-in aggregation, downsampling, and retention policies
- **Key Pattern**: `ts:metric:source:filename`
- **Example**: `ts:temperature:sensor1:data.xlsx`
- **Password**: password

### Redis Pub/Sub (Port 6381)
- **Purpose**: Inter-service communication and event messaging
- **Features**: Real-time message broadcasting between services
- **Password**: password

### PDF Generator Service (Port 50051)
- **Purpose**: Generate PDF reports from Redis TimeSeries data
- **Protocol**: gRPC
- **Features**: Chart generation, statistical analysis, PDF creation
- **Language**: Go 1.21+

## Configuration Architecture

This project implements a **centralized configuration system** that eliminates duplication and provides consistent configuration across all services.

### Key Features

- **🏗️ Single Source of Truth**: All configuration is centralized in the `shared/config/` directory
- **🎯 Service-Specific Factories**: `getServiceAConfig()`, `getServiceBConfig()`, `getBaseConfig()`
- **🔧 Unified Client Management**: Centralized MongoDB and Redis client lifecycle management
- **🔗 Backward Compatibility**: Existing service code continues to work without changes
- **✅ Type Safety**: Full TypeScript interfaces and validation
- **🛡️ Environment Overrides**: Easy environment-specific configuration

### Configuration Structure

```typescript
// Centralized config factories
import { getServiceAConfig, getServiceBConfig, getBaseConfig } from '@two-services/shared';

// Service-specific configuration
const serviceAConfig = getServiceAConfig();
const serviceBConfig = getServiceBConfig();

// Shared base configuration
const baseConfig = getBaseConfig();
```

### Service Configuration Files

Each service has a lightweight configuration wrapper that maintains backward compatibility:

```typescript
// serviceA/src/app/utils/config.util.ts
import { getServiceAConfig } from '@two-services/shared';

const centralizedConfig = getServiceAConfig();

export const config = {
  // Legacy format for backward compatibility
  mongodb: {
    uri: centralizedConfig.database.mongodb.connectionString,
    dbName: centralizedConfig.database.mongodb.database
  },
  redis: {
    host: centralizedConfig.database.redis.host,
    port: centralizedConfig.database.redis.port,
    channels: centralizedConfig.redis.channels
  },
  // Service-specific configurations
  upload: centralizedConfig.upload,
  dataFetcher: centralizedConfig.dataFetcher,
  service: centralizedConfig.service
};
```

### Client Management

The `ClientManagerService` provides centralized lifecycle management for database connections:

```typescript
import { ClientManagerService } from '@two-services/shared';

// Automatic connection management with health checks
// Proper cleanup to prevent test hanging
// Unified configuration across all services
```

### Benefits

- **No Configuration Duplication**: Same settings shared across services
- **Centralized Updates**: Change once, apply everywhere
- **Test Reliability**: Proper client cleanup prevents hanging tests
- **Environment Flexibility**: Easy environment-specific overrides
- **Type Safety**: TypeScript interfaces prevent configuration errors
- **Maintainability**: Single place to manage all service configurations

## Prerequisites

- Node.js (v18 or higher)
- npm
- Docker
- Docker Compose
- Go 1.21+ (for PDF generator development)
- Protocol Buffers compiler (protoc)

## Project Structure

```
two-services/
├── .github/                    # GitHub workflows and configurations
├── .vscode/                    # VS Code workspace settings
├── apps/                       # Application source code
│   └── serviceA/              # ServiceA application files
├── docker/                     # Docker configuration files
│   ├── mongodb/               # MongoDB initialization scripts
│   │   └── init/
│   │       └── init-mongo.js
│   └── redis/                 # Redis configuration
│       └── redis.conf
├── pdf-generator/              # Go PDF generator service
│   ├── internal/              # Internal Go packages
│   │   ├── redis/             # Redis TimeSeries client
│   │   │   └── client.go
│   │   └── service/           # PDF generation service
│   │       └── pdf_service.go
│   ├── proto/                 # Protocol buffer definitions
│   │   ├── pdf_generator.proto
│   │   ├── pdf_generator.pb.go
│   │   └── pdf_generator_grpc.pb.go
│   ├── pkg/                   # Public Go packages
│   ├── Dockerfile             # Docker configuration for Go service
│   ├── go.mod                 # Go module dependencies
│   ├── go.sum                 # Go module checksums
│   ├── main.go                # Main Go application
│   ├── README.md              # PDF generator documentation
│   └── setup.sh               # Setup script for Go service
├── serviceA/                   # ServiceA NestJS microservice
│   ├── src/                   # Source code
│   │   ├── app/               # Application logic
│   │   │   ├── controllers/   # HTTP controllers
│   │   │   ├── dto/           # Data transfer objects
│   │   │   ├── services/      # Business logic services
│   │   │   └── types/         # TypeScript type definitions
│   │   ├── assets/            # Static assets
│   │   └── main.ts            # Application entry point
│   ├── uploads/               # File upload directory
│   ├── Dockerfile             # Docker configuration
│   ├── package.json           # Node.js dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   └── webpack.config.js      # Webpack configuration
├── serviceA-e2e/              # End-to-end tests for ServiceA
│   ├── src/
│   │   ├── service-a/
│   │   │   └── service-a.spec.ts
│   │   └── support/           # Test support files
│   └── package.json
├── serviceB/                   # ServiceB NestJS microservice
│   ├── src/                   # Source code
│   │   ├── app/               # Application logic
│   │   │   ├── controllers/   # HTTP controllers
│   │   │   ├── services/      # Business logic services
│   │   │   ├── pdf-report.controller.ts  # PDF report endpoints
│   │   │   └── types/         # TypeScript type definitions
│   │   ├── assets/            # Static assets
│   │   └── main.ts            # Application entry point
│   ├── Dockerfile             # Docker configuration
│   ├── package.json           # Node.js dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   └── webpack.config.js      # Webpack configuration
├── serviceB-e2e/              # End-to-end tests for ServiceB
│   ├── src/
│   │   ├── service-b/
│   │   └── support/           # Test support files
│   └── package.json
├── shared/                     # Shared libraries and utilities
│   ├── config/                # Centralized configuration system
│   │   ├── app.config.ts      # Service-specific config factories
│   │   └── database.config.ts # Database connection configuration
│   ├── dto/                   # Data transfer objects
│   │   ├── base.dto.ts
│   │   └── common.dto.ts
│   ├── grpc-clients/          # gRPC client implementations
│   │   ├── pdf-generator.client.ts
│   │   └── pdf_generator.proto
│   ├── services/              # Shared services
│   │   ├── client-manager.service.ts    # Centralized client lifecycle
│   │   ├── event-publisher.service.ts
│   │   ├── logger.service.ts
│   │   ├── mongo.service.ts
│   │   └── redis.service.ts
│   ├── types/                 # Shared type definitions
│   │   ├── common.types.ts
│   │   └── database.types.ts
│   ├── utils/                 # Utility functions
│   │   └── helpers.ts
│   ├── index.ts               # Main export file
│   ├── package.json           # Shared package dependencies
│   └── tsconfig.json          # TypeScript configuration
├── uploads/                    # Global uploads directory
├── docker-compose.yml          # Production Docker Compose
├── docker-compose.dev.yml      # Development Docker Compose
├── test-pdf-generator.sh       # PDF generator test script
├── start.sh                    # Production start script
├── start-dev.sh               # Development start script
├── package.json               # Root package.json
├── nx.json                    # Nx workspace configuration
├── tsconfig.base.json         # Base TypeScript configuration
├── jest.config.ts             # Jest test configuration
├── eslint.config.mjs          # ESLint configuration
├── Makefile                   # Make commands
├── PDF_GENERATOR_IMPLEMENTATION.md    # PDF generator implementation guide
├── PDF_GENERATOR_INTEGRATION.md      # PDF generator integration guide
├── SHARED_COMPONENTS.md               # Shared components documentation
├── SWAGGER_INTEGRATION.md             # Swagger integration guide
└── README.md                          # This file
```

## Development

### Quick Start

1. **Start all services with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Services will be available at:**
   - ServiceA: http://localhost:3001/api
   - ServiceB: http://localhost:3002/api
   - PDF Generator: grpc://localhost:50051
   - MongoDB: mongodb://localhost:27017
   - Redis: redis://localhost:6379
   - Redis TimeSeries: redis://localhost:6380
   - Redis Pub/Sub: redis://localhost:6381

3. **Test the system:**
   ```bash
   ./test-pdf-generator.sh
   ```

### Running Services Individually

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start infrastructure services:**
   ```bash
   docker-compose up mongodb redis redis-timeseries redis-pubsub
   ```

3. **Run ServiceA:**
   ```bash
   npx nx serve serviceA
   # or
   npx nx run @two-services/serviceA:serve
   ```
   ServiceA will be available at: http://localhost:3001/api

4. **Run ServiceB:**
   ```bash
   npx nx serve serviceB
   # or
   npx nx run @two-services/serviceB:serve
   ```
   ServiceB will be available at: http://localhost:3002/api

5. **Run PDF Generator:**
   ```bash
   cd pdf-generator
   go run main.go
   ```
   PDF Generator will be available at: grpc://localhost:50051

### Building Services

1. **Build ServiceA:**
   ```bash
   npx nx build serviceA
   ```

2. **Build ServiceB:**
   ```bash
   npx nx build serviceB
   ```

3. **Build all services:**
   ```bash
   npx nx run-many -t build
   ```

### Testing

1. **Test ServiceA:**
   ```bash
   npx nx test serviceA
   ```

2. **Test ServiceB:**
   ```bash
   npx nx test serviceB
   ```

3. **Run E2E tests:**
   ```bash
   npx nx e2e serviceA-e2e
   npx nx e2e serviceB-e2e
   ```

## Docker

### Building Docker Images

1. **Build ServiceA Docker image:**
   ```bash
   npx nx docker-build serviceA
   ```

2. **Build ServiceB Docker image:**
   ```bash
   npx nx docker-build serviceB
   ```

### Running Individual Containers

1. **Run ServiceA container:**
   ```bash
   docker run -p 3000:3000 -t two-services-servicea
   ```

2. **Run ServiceB container:**
   ```bash
   docker run -p 3001:3001 -t two-services-serviceb
   ```

## Docker Compose

### Production Environment

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Start services in detached mode:**
   ```bash
   docker-compose up -d
   ```

3. **Stop services:**
   ```bash
   docker-compose down
   ```

4. **View logs:**
   ```bash
   docker-compose logs
   # or for specific service
   docker-compose logs servicea
   docker-compose logs serviceb
   docker-compose logs mongodb
   docker-compose logs redis
   ```

### Development Environment

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Start in detached mode:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

## Database Access

### MongoDB
- **Connection String**: `mongodb://app-user:app-password@localhost:27017/two-services`
- **Admin UI**: Use MongoDB Compass or any MongoDB client
- **Database**: `two-services`

### Redis
- **Connection**: `redis://:password@localhost:6379/0`
- **CLI Access**: `redis-cli -h localhost -p 6379 -a password`

### Redis TimeSeries
- **Connection**: `redis://:password@localhost:6380/0`
- **CLI Access**: `redis-cli -h localhost -p 6380 -a password`

### Redis Pub/Sub
- **Connection**: `redis://:password@localhost:6381/0`
- **CLI Access**: `redis-cli -h localhost -p 6381 -a password`

## API Endpoints

### ServiceA (Port 3001) - Data Ingestion & Processing
- **GET** `http://localhost:3001/api` - Health check
- **GET** `http://localhost:3001/api/health` - Health status
- **POST** `http://localhost:3001/api/upload` - File upload (JSON/Excel)
- **GET** `http://localhost:3001/api/search` - Search MongoDB data
- **POST** `http://localhost:3001/api/stream` - Stream data processing
- **POST** `http://localhost:3001/api/data` - Store data in MongoDB
- **GET** `http://localhost:3001/api/data` - Retrieve data from MongoDB
- **POST** `http://localhost:3001/api/events` - Publish events to Redis Pub/Sub

### ServiceB (Port 3002) - Logging & Reporting
- **GET** `http://localhost:3002/api` - Health check
- **GET** `http://localhost:3002/api/health` - Health status
- **POST** `http://localhost:3002/api/metrics` - Store time-series data
- **GET** `http://localhost:3002/api/metrics` - Retrieve time-series data
- **POST** `http://localhost:3002/api/cache` - Cache operations
- **GET** `http://localhost:3002/api/logs` - Query event logs
- **POST** `http://localhost:3002/reports/generate` - Generate PDF report (sync)
- **POST** `http://localhost:3002/reports/generate-async` - Generate PDF report (async)
- **GET** `http://localhost:3002/reports/status/:reportId` - Get report status

### PDF Generator (Port 50051) - gRPC Service
- **GenerateReport** - Generate PDF from time-series data
- **GetReportStatus** - Get report generation status

## Example Usage

### 1. Upload Data and Generate PDF Report

```bash
# Upload data via ServiceA
curl -X POST http://localhost:3001/api/upload \
  -F "file=@temperature-data.xlsx"

# Generate PDF report via ServiceB
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

### 2. Stream Data Processing

```bash
# Stream data to ServiceA
curl -X POST http://localhost:3001/api/stream \
  -H "Content-Type: application/json" \
  -d '{
    "source": "sensor1",
    "data": [
      {"timestamp": 1640995200000, "temperature": 23.5, "humidity": 65.2},
      {"timestamp": 1640995260000, "temperature": 23.7, "humidity": 64.8}
    ]
  }'
```

### 3. Query Time-Series Data

```bash
# Query metrics from ServiceB
curl -X GET "http://localhost:3002/api/metrics?metric=temperature&start=2024-01-01T00:00:00Z&end=2024-01-02T00:00:00Z"
```

### 4. Generate Async PDF Report

```bash
# Start async report generation
curl -X POST http://localhost:3002/reports/generate-async \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "weekly",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-07T00:00:00Z",
    "metrics": ["temperature", "humidity", "pressure"],
    "filters": {"source": "sensor1"}
  }'

# Check report status
curl -X GET http://localhost:3002/reports/status/report_1640995200000
```

## Data Services Integration

### Centralized Configuration Usage

```typescript
// Using centralized configuration in services
import { getServiceAConfig, MongoService, RedisService } from '@two-services/shared';

// Get service-specific configuration
const config = getServiceAConfig();

// Configuration is automatically applied to shared services
const mongoService = new MongoService();
const redisService = new RedisService();
```

### MongoDB Operations
```typescript
// Example usage in services
import { MongoService } from '@two-services/shared';

// Store data
await this.mongoService.insertOne('serviceA_data', {
  userId: '123',
  data: { key: 'value' },
  status: 'active'
});

// Retrieve data
const data = await this.mongoService.findOne('serviceA_data', { userId: '123' });
```

### Redis Operations
```typescript
// Example usage in services
import { RedisService } from '@two-services/shared';

// Caching
await this.redisService.set('user:123', JSON.stringify(userData), 3600);
const cachedData = await this.redisService.get('user:123');

// Pub/Sub
await this.redisService.publish('user-events', JSON.stringify(event));
await this.redisService.subscribe('user-events', (message) => {
  console.log('Received:', message);
});
```

### Client Lifecycle Management
```typescript
// Centralized client management
import { ClientManagerService } from '@two-services/shared';

@Injectable()
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(private clientManager: ClientManagerService) {}

  async onModuleInit() {
    // Clients are automatically initialized with centralized config
    await this.clientManager.onModuleInit();
  }

  async onModuleDestroy() {
    // Proper cleanup prevents test hanging
    await this.clientManager.onModuleDestroy();
  }
}

### Time Series Operations
```typescript
// Store metrics
await this.redisService.addTimeSeries('cpu:usage', Date.now(), 75.5);

// Retrieve metrics
const metrics = await this.redisService.getTimeSeriesRange(
  'cpu:usage',
  Date.now() - 3600000,
  Date.now()
);
```

### PDF Generation via gRPC
```typescript
// Example usage in ServiceB
import { PDFGeneratorClient } from '@two-services/shared';

const pdfResponse = await this.pdfGeneratorClient.generateReport({
  reportType: 'daily',
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-02T00:00:00Z',
  metrics: ['temperature', 'humidity'],
  filters: { source: 'sensor1' }
});
```

## Health Checks

All services include health checks that can be monitored:
- Health checks run every 30 seconds
- 3 retries before marking as unhealthy
- 30-second startup grace period

### Service Health Endpoints
- ServiceA: `GET /health`
- ServiceB: `GET /health`
- PDF Generator: gRPC health check

## Environment Variables

The centralized configuration system automatically reads environment variables and applies them across all services. This ensures consistent configuration without duplication.

### Shared Configuration Variables
These variables are used by the centralized configuration system:

#### Database Configuration
- `MONGODB_HOST`: MongoDB host (default: localhost)
- `MONGODB_PORT`: MongoDB port (default: 27017)
- `MONGODB_USERNAME`: MongoDB username (default: app-user)
- `MONGODB_PASSWORD`: MongoDB password (default: app-password)
- `MONGODB_DATABASE`: MongoDB database name (default: two-services)
- `MONGODB_AUTH_SOURCE`: MongoDB auth source (default: admin)

#### Redis Configuration
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (default: password)
- `REDIS_DB`: Redis database number (default: 0)

#### Redis TimeSeries Configuration
- `REDIS_TIMESERIES_HOST`: Redis TimeSeries host (default: localhost)
- `REDIS_TIMESERIES_PORT`: Redis TimeSeries port (default: 6380)
- `REDIS_TIMESERIES_PASSWORD`: Redis TimeSeries password (default: password)
- `REDIS_TIMESERIES_DB`: Redis TimeSeries database number (default: 0)

#### Redis Pub/Sub Configuration
- `REDIS_PUBSUB_HOST`: Redis Pub/Sub host (default: localhost)
- `REDIS_PUBSUB_PORT`: Redis Pub/Sub port (default: 6381)
- `REDIS_PUBSUB_PASSWORD`: Redis Pub/Sub password (default: password)
- `REDIS_PUBSUB_DB`: Redis Pub/Sub database number (default: 0)

### Service-Specific Variables

#### ServiceA
- `NODE_ENV`: Environment mode (development/production)
- `SERVICEA_PORT`: Port number (default: 3001)
- `SERVICEA_HOST`: Host address (default: 0.0.0.0)
- `SERVICEA_NAME`: Service name (default: serviceA)

#### ServiceB
- `NODE_ENV`: Environment mode (development/production)
- `SERVICEB_PORT`: Port number (default: 3002)
- `SERVICEB_HOST`: Host address (default: 0.0.0.0)
- `SERVICEB_NAME`: Service name (default: serviceB)
- `PDF_GENERATOR_ADDR`: PDF generator gRPC address (default: localhost:50051)

### PDF Generator
- `GRPC_PORT`: gRPC server port (default: 50051)
- `REDIS_TIMESERIES_ADDR`: Redis TimeSeries address (default: localhost:6380)
- `REDIS_PASSWORD`: Redis password (default: password)

### Configuration Override Examples

```bash
# Override MongoDB settings
export MONGODB_HOST=production-mongo.example.com
export MONGODB_USERNAME=prod-user
export MONGODB_PASSWORD=secure-password

# Override Redis settings
export REDIS_HOST=redis-cluster.example.com
export REDIS_PASSWORD=redis-secure-password

# Override service ports
export SERVICEA_PORT=4001
export SERVICEB_PORT=4002
```

## Useful Commands

### Docker Compose Commands
```bash
# Start all services
docker-compose up --build

# Start in development mode
docker-compose -f docker-compose.dev.yml up --build

# View running containers
docker-compose ps

# Restart a specific service
docker-compose restart servicea

# Rebuild and start a specific service
docker-compose up --build servicea

# View logs
docker-compose logs servicea
docker-compose logs serviceb
docker-compose logs pdf-generator

# View resource usage
docker-compose top

# Stop services
docker-compose down

# Clean up everything
docker-compose down -v --remove-orphans
docker system prune -a
```

### Development Commands
```bash
# Install dependencies
npm install

# Build all services
npx nx run-many -t build

# Test all services
npx nx run-many -t test

# Test specific service
npx nx test serviceA
npx nx test serviceB

# Run E2E tests
npx nx e2e serviceA-e2e
npx nx e2e serviceB-e2e

# Lint all projects
npx nx run-many -t lint
```

### PDF Generator Commands
```bash
# Setup PDF generator
cd pdf-generator
./setup.sh

# Build PDF generator
go build -o pdf-generator main.go

# Run PDF generator
./pdf-generator

# Test PDF generator
cd .. && ./test-pdf-generator.sh
```

### Database Commands
```bash
# Connect to MongoDB
mongo mongodb://admin:password@localhost:27017/two-services

# Connect to Redis
redis-cli -h localhost -p 6379 -a password

# Connect to Redis TimeSeries
redis-cli -h localhost -p 6380 -a password

# Connect to Redis Pub/Sub
redis-cli -h localhost -p 6381 -a password

# Test Redis TimeSeries
redis-cli -h localhost -p 6380 -a password
TS.ADD ts:temperature:test:sample.json * 25.5 LABELS metric temperature source test

# Query Redis TimeSeries
redis-cli -h localhost -p 6380 -a password
TS.RANGE ts:temperature:test:sample.json 0 -1
```

## Networking

When running with Docker Compose, all services are connected via a custom bridge network `microservices-network`. This allows services to communicate with each other using their service names:

- ServiceA communicates with MongoDB, Redis services
- ServiceB communicates with MongoDB, Redis services, and PDF Generator
- PDF Generator communicates with Redis TimeSeries

## Security Features

- Non-root user execution in containers
- Proper file permissions
- Health checks for monitoring
- Network isolation using Docker networks
- Password-protected Redis instances
- MongoDB authentication

## Scaling

To scale services horizontally:

```bash
# Scale ServiceA to 3 instances
docker-compose up --scale servicea=3

# Scale ServiceB to 2 instances
docker-compose up --scale serviceb=2

# Scale PDF Generator to 2 instances
docker-compose up --scale pdf-generator=2
```

Note: When scaling, you'll need to configure a load balancer or use different ports.

## Troubleshooting

### Common Issues

1. **Port conflicts**: 
   - ServiceA: 3001, ServiceB: 3002, PDF Generator: 50051
   - Ensure these ports are not in use by other applications

2. **Build failures**: 
   - Run `docker-compose down` and `docker-compose up --build` to rebuild
   - Check for missing dependencies or configuration errors

3. **Permission issues**: 
   - Check Docker daemon permissions and file ownership
   - Ensure proper file permissions for uploads directory

4. **Health check failures**: 
   - Verify services are responding on their respective ports
   - Check service logs for error messages

5. **PDF Generation fails**:
   - Check Redis TimeSeries connection
   - Verify time range has data
   - Check metric names and filters

6. **gRPC Connection issues**:
   - Ensure PDF generator service is running
   - Check network connectivity
   - Verify gRPC port configuration

7. **Empty Reports**:
   - Check if data exists in the time range
   - Verify metric names match Redis keys
   - Check filter criteria

### Debug Commands

```bash
# Check service logs
docker-compose logs servicea
docker-compose logs serviceb
docker-compose logs pdf-generator

# Check Redis TimeSeries data
redis-cli -h localhost -p 6380 -a password
TS.RANGE ts:temperature:sensor1:data.xlsx 0 -1

# Check gRPC service
grpcurl -plaintext localhost:50051 list

# Test PDF generation
./test-pdf-generator.sh

# Check container health
docker-compose ps
```

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure Docker containers build successfully
5. Test both individual and composed service deployments
6. Update shared types and interfaces when needed
7. Follow TypeScript and Go best practices

## Architecture Improvements

### Recent Enhancements

#### Centralized Configuration System (v2.0)
- **Problem Solved**: Eliminated configuration duplication across services
- **Implementation**: Created centralized config factories in `shared/config/`
- **Benefits**: Single source of truth, type safety, environment flexibility
- **Backward Compatibility**: Existing service code works without changes

#### Unified Client Management
- **Problem Solved**: Inconsistent client lifecycle management causing test issues
- **Implementation**: `ClientManagerService` with proper initialization and cleanup
- **Benefits**: Prevents test hanging, unified connection management, health checks

#### Test Reliability Improvements
- **Problem Solved**: Tests hanging due to open database connections
- **Implementation**: Proper client cleanup with `forceExit` configuration
- **Benefits**: Reliable CI/CD pipeline, faster test execution

### Architectural Principles

1. **Single Source of Truth**: Configuration defined once, used everywhere
2. **Type Safety**: Full TypeScript interfaces prevent configuration errors
3. **Separation of Concerns**: Clear boundaries between services and shared logic
4. **Backward Compatibility**: Changes don't break existing functionality
5. **Test Reliability**: Proper resource cleanup ensures stable testing
6. **Environment Flexibility**: Easy configuration overrides for different environments

## Additional Documentation

- **PDF Generator Implementation**: See `PDF_GENERATOR_IMPLEMENTATION.md`
- **PDF Generator Integration**: See `PDF_GENERATOR_INTEGRATION.md`
- **Shared Components**: See `SHARED_COMPONENTS.md`
- **Swagger Integration**: See `SWAGGER_INTEGRATION.md`

## Technologies Used

### Backend
- **NestJS**: Node.js framework for building efficient server-side applications
- **Go**: For high-performance PDF generation service
- **TypeScript**: Type-safe JavaScript development

### Architecture
- **Centralized Configuration**: Single source of truth for all service configurations
- **Shared Libraries**: Common utilities and services across microservices
- **Client Lifecycle Management**: Unified database connection management
- **Nx Monorepo**: Build system and workspace management

### Databases
- **MongoDB**: NoSQL document database
- **Redis**: In-memory data structure store
- **Redis TimeSeries**: Time-series database module

### Communication
- **gRPC**: High-performance RPC framework
- **HTTP/REST**: Standard web API protocol
- **Redis Pub/Sub**: Message broker for real-time communication

### Infrastructure
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container orchestration
- **Nx**: Build system and monorepo tools

### Libraries
- **fpdf**: PDF generation library (Go)
- **go-chart**: Chart generation library (Go)
- **exceljs**: Excel file processing (Node.js)
- **mongoose**: MongoDB object modeling (Node.js)

To create a production bundle:

```sh
npx nx build serviceA
```

To see all available targets to run for a project, run:

```sh
npx nx show project serviceA
```

These targets are either in nx or defined in the `project.json` or `package.json` files.



