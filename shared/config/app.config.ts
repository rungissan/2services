import { getDatabaseConfig } from './database.config';

export interface ServiceConfig {
  name: string;
  port: number;
  environment: string;
}

export interface AppConfig {
  service: ServiceConfig;
  database: ReturnType<typeof getDatabaseConfig>;
  redis: {
    channels: {
      fileUpload: string;
      dataFetch: string;
      searchQuery: string;
    };
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    uploadPath: string;
  };
  dataFetcher: {
    url: string;
    timeout: number;
    retryAttempts: number;
  };
  pdf: {
    outputPath: string;
    maxReportSize: number;
    defaultFormat: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
  };
}

// Base config shared across all services
export const getBaseConfig = (): Omit<AppConfig, 'service'> => {
  return {
    database: getDatabaseConfig(),
    redis: {
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
    pdf: {
      outputPath: process.env.PDF_OUTPUT_PATH || './reports',
      maxReportSize: parseInt(process.env.PDF_MAX_REPORT_SIZE || '52428800'), // 50MB
      defaultFormat: process.env.PDF_DEFAULT_FORMAT || 'pdf'
    },
    logging: {
      level: (process.env.LOG_LEVEL as AppConfig['logging']['level']) || 'info',
      enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
      enableFile: process.env.LOG_ENABLE_FILE === 'true'
    }
  };
};

// Service-specific config factories
export const getServiceAConfig = (): AppConfig => {
  return {
    service: {
      name: 'serviceA',
      port: parseInt(process.env.SERVICE_A_PORT || '3000'),
      environment: process.env.NODE_ENV || 'development'
    },
    ...getBaseConfig()
  };
};

export const getServiceBConfig = (): AppConfig => {
  return {
    service: {
      name: 'serviceB',
      port: parseInt(process.env.SERVICE_B_PORT || '3001'),
      environment: process.env.NODE_ENV || 'development'
    },
    ...getBaseConfig()
  };
};

// Generic service config factory
export const getServiceConfig = (serviceName: string, defaultPort: number): AppConfig => {
  const portEnvVar = `SERVICE_${serviceName.toUpperCase()}_PORT`;
  return {
    service: {
      name: serviceName,
      port: parseInt(process.env[portEnvVar] || defaultPort.toString()),
      environment: process.env.NODE_ENV || 'development'
    },
    ...getBaseConfig()
  };
};
