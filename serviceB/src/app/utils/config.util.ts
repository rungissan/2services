export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'serviceB'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    channels: {
      fileUpload: 'file-upload',
      dataFetch: 'data-fetch',
      searchQuery: 'search-query'
    }
  },
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760'), // 10MB
    allowedMimeTypes: (process.env.UPLOAD_ALLOWED_MIME_TYPES || 'application/json').split(','),
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },
  pdf: {
    outputPath: process.env.PDF_OUTPUT_PATH || './reports',
    maxReportSize: parseInt(process.env.PDF_MAX_REPORT_SIZE || '52428800'), // 50MB
    defaultFormat: process.env.PDF_DEFAULT_FORMAT || 'pdf'
  },
  service: {
    name: 'serviceB',
    port: parseInt(process.env.SERVICE_B_PORT || '3001'),
    environment: process.env.NODE_ENV || 'development'
  },
  logging: {
    level: (['debug', 'info', 'warn', 'error'].includes(process.env.LOG_LEVEL || '')
      ? process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error'
      : 'info'),
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true'
  }
};
