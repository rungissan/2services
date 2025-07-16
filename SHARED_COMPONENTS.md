# Shared Components Between Services

## Overview
This document outlines the shared components that have been created and can be used across both ServiceA and ServiceB to promote code reuse and consistency.

## 1. Shared Configuration Structure

### Common Configuration Format
Both services now use a unified configuration structure:

```typescript
export const config = {
  mongodb: {
    uri: string;
    dbName: string;
  },
  redis: {
    host: string;
    port: number;
    channels: {
      fileUpload: string;
      dataFetch: string;
      searchQuery: string;
    }
  },
  service: {
    name: string;
    port: number;
    environment: string;
  },
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
  }
  // Service-specific configs...
}
```

### Environment Variables
Both services support the same set of environment variables:
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name
- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port
- `UPLOAD_MAX_FILE_SIZE` - Max file size for uploads
- `UPLOAD_ALLOWED_MIME_TYPES` - Allowed MIME types (comma-separated)
- `DATA_FETCHER_URL` - External data source URL
- `LOG_LEVEL` - Logging level
- `SERVICE_A_PORT` / `SERVICE_B_PORT` - Service ports

## 2. Shared Types

### Event Types
- **`RedisEvent`** - Base interface for all Redis events
- **`FileUploadEvent`** - File upload events
- **`DataFetchEvent`** - Data fetching events
- **`SearchQueryEvent`** - Search query events

### Common Interfaces
- **`PaginationQuery`** - Standard pagination parameters
- **`DateRangeQuery`** - Date range filtering
- **`ApiResponse<T>`** - Standardized API response format

### ServiceB-Specific Types
- **`LogEvent`** - Log entry structure
- **`LogQuery`** - Log query parameters
- **`ReportRequest`** - Report generation request

## 3. Shared Helper Classes

### ApiResponseHelper
- `success<T>(data: T, message?: string)` - Success response
- `error(error: string)` - Error response

### PaginationHelper
- `validatePagination(query)` - Validate and normalize pagination
- `calculateSkip(page, limit)` - Calculate MongoDB skip value
- `calculateTotalPages(total, limit)` - Calculate total pages

### DateHelper
- `isValidDate(date)` - Date validation
- `parseDate(dateString)` - Safe date parsing
- `formatDate(date)` - ISO date formatting
- `getDateRange(startDate?, endDate?)` - Default date range

### ValidationHelper
- `validateEmail(email)` - Email validation
- `validateUrl(url)` - URL validation
- `validateFileSize(size, maxSize)` - File size validation
- `validateMimeType(mimeType, allowedTypes)` - MIME type validation
- `sanitizeFilename(filename)` - Filename sanitization

### ErrorHelper
- `formatError(error)` - Error message formatting
- `isRetryableError(error)` - Determine if error is retryable

## 4. Shared Services

### EventPublisherService
Available in ServiceA for publishing events:
- `publishFileUploadEvent(event)` - Publish file upload events
- `publishDataFetchEvent(event)` - Publish data fetch events
- `publishSearchQueryEvent(event)` - Publish search query events

## 5. What Could Be Further Shared

### Database Services
The `/shared/services/` directory contains:
- **`MongoService`** - MongoDB connection and operations
- **`RedisService`** - Redis client with TimeSeries support
- **`LoggerService`** - Centralized logging service

### Additional Shared Components
- **Database connection pools** - Shared MongoDB/Redis connections
- **Authentication middleware** - Common auth logic
- **Rate limiting** - Shared rate limiting logic
- **Error handling middleware** - Common error handling
- **Health check endpoints** - Standard health checks
- **Metrics collection** - Shared metrics/monitoring
- **Validation schemas** - Common input validation
- **File upload handling** - Shared file operations
- **PDF generation utilities** - Common report generation

## 6. Implementation Benefits

### Code Reuse
- Common types prevent type mismatches
- Shared helpers reduce code duplication
- Consistent configuration across services

### Maintainability
- Changes to common logic only need to be made once
- Easier to update shared functionality
- Consistent error handling and logging

### Development Efficiency
- Faster development of new features
- Reduced testing burden for common functionality
- Consistent API responses across services

## 7. Future Improvements

### Proper NX Library
Consider creating a proper NX library for truly shared components:
```bash
nx generate @nx/js:library shared --importPath=@two-services/shared
```

### Package Structure
```
libs/
  shared/
    src/
      lib/
        config/
        types/
        services/
        utils/
      index.ts
```

### Build Integration
- Shared library compilation
- Automatic type generation
- Dependency management

## 8. Current File Structure

```
serviceA/src/app/
  ├── config.ts (shared structure)
  ├── common-types.ts (shared types)
  ├── helpers.ts (shared utilities)
  └── event-publisher.service.ts (Redis publishing)

serviceB/src/app/
  ├── config.ts (shared structure)
  ├── common-types.ts (shared types)
  ├── helpers.ts (shared utilities)
  └── types.ts (exports common types)

shared/ (reference implementation)
  ├── config/
  ├── types/
  ├── services/
  └── utils/
```

This shared approach provides a solid foundation for code reuse while maintaining service independence and allowing for service-specific customizations.
