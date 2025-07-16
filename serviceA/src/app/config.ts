export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'serviceA'
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
  dataFetcher: {
    url: process.env.DATA_FETCHER_URL || 'https://www.ura.org.ua/timeseries_data_quoter.json',
    timeout: parseInt(process.env.DATA_FETCHER_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.DATA_FETCHER_RETRY_ATTEMPTS || '3')
  },
  service: {
    name: 'serviceA',
    port: parseInt(process.env.SERVICE_A_PORT || '3000'),
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
