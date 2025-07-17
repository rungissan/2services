import { getServiceAConfig } from '@two-services/shared';

// Get the centralized config
const centralizedConfig = getServiceAConfig();

// Transform to maintain backward compatibility with existing code
export const config = {
  // MongoDB section (legacy format)
  mongodb: {
    uri: centralizedConfig.database.mongodb.connectionString,
    dbName: centralizedConfig.database.mongodb.database
  },

  // Redis section (legacy format with channels inside)
  redis: {
    host: centralizedConfig.database.redis.host,
    port: centralizedConfig.database.redis.port,
    channels: centralizedConfig.redis.channels
  },

  // Service-specific sections
  upload: centralizedConfig.upload,
  dataFetcher: centralizedConfig.dataFetcher,
  pdf: centralizedConfig.pdf,
  logging: centralizedConfig.logging,

  // Service info
  service: centralizedConfig.service,
  database: centralizedConfig.database
};

// For backward compatibility, export individual config sections
export const { service, database, redis } = config;
