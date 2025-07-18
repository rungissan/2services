export interface DatabaseConfig {
  mongodb: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    authSource: string;
    connectionString: string;
  };
  redis: {
    host: string;
    port: number;
    db: number;
    connectionString: string;
  };
  redisTimeSeries: {
    host: string;
    port: number;
    db: number;
    connectionString: string;
  };
  redisPubSub: {
    host: string;
    port: number;
    db: number;
    connectionString: string;
  };
}

export const getDatabaseConfig = (): DatabaseConfig => {
  // Load local environment file for development if it exists
  if (process.env.NODE_ENV !== 'production') {
    try {
      require('dotenv').config({ path: '.env.local' });
      require('dotenv').config({ path: '.env' });
    } catch {
      // dotenv might not be available in all environments
    }
  }

  return {
    mongodb: {
      host: process.env.MONGO_HOST || 'localhost',
      port: parseInt(process.env.MONGO_PORT || '27017'),
      username: process.env.MONGO_USERNAME || 'app-user',
      password: process.env.MONGO_PASSWORD || 'app-password',
      database: process.env.MONGO_DATABASE || 'two-services',
      authSource: process.env.MONGO_AUTH_SOURCE || 'two-services',
      connectionString: process.env.MONGO_CONNECTION_STRING || 'mongodb://app-user:app-password@localhost:27017/two-services',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0'),
      connectionString: process.env.REDIS_CONNECTION_STRING || 'redis://localhost:6379/0',
    },
    redisTimeSeries: {
      host: process.env.REDIS_TIMESERIES_HOST || 'localhost',
      port: parseInt(process.env.REDIS_TIMESERIES_PORT || '6380'),
      db: parseInt(process.env.REDIS_TIMESERIES_DB || '0'),
      connectionString: process.env.REDIS_TIMESERIES_CONNECTION_STRING || 'redis://localhost:6380/0',
    },
    redisPubSub: {
      host: process.env.REDIS_PUBSUB_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PUBSUB_PORT || '6381'),
      db: parseInt(process.env.REDIS_PUBSUB_DB || '0'),
      connectionString: process.env.REDIS_PUBSUB_CONNECTION_STRING || 'redis://localhost:6381/0',
    },
  };
};
