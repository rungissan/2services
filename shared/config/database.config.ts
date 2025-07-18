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

  const mongoHost = process.env.MONGO_HOST || 'localhost';
  const mongoPort = process.env.MONGO_PORT || '27017';
  const mongoUsername = process.env.MONGO_USERNAME || '';
  const mongoPassword = process.env.MONGO_PASSWORD || '';
  const mongoDatabase = process.env.MONGO_DATABASE || 'two-services';
  const mongoAuthSource = process.env.MONGO_AUTH_SOURCE || 'admin';

  // Build connection string dynamically based on whether we have credentials
  let mongoConnectionString;
  if (mongoUsername && mongoPassword) {
    mongoConnectionString = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=${mongoAuthSource}`;
  } else {
    mongoConnectionString = `mongodb://${mongoHost}:${mongoPort}/${mongoDatabase}`;
  }

  return {
    mongodb: {
      host: mongoHost,
      port: parseInt(mongoPort),
      username: mongoUsername,
      password: mongoPassword,
      database: mongoDatabase,
      authSource: mongoAuthSource,
      connectionString: process.env.MONGO_CONNECTION_STRING || mongoConnectionString,
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0'),
      connectionString: process.env.REDIS_CONNECTION_STRING || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}/${process.env.REDIS_DB || '0'}`,
    },
    redisTimeSeries: {
      host: process.env.REDIS_TIMESERIES_HOST || 'localhost',
      port: parseInt(process.env.REDIS_TIMESERIES_PORT || '6380'),
      db: parseInt(process.env.REDIS_TIMESERIES_DB || '0'),
      connectionString: process.env.REDIS_TIMESERIES_CONNECTION_STRING || `redis://${process.env.REDIS_TIMESERIES_HOST || 'localhost'}:${process.env.REDIS_TIMESERIES_PORT || '6380'}/${process.env.REDIS_TIMESERIES_DB || '0'}`,
    },
    redisPubSub: {
      host: process.env.REDIS_PUBSUB_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PUBSUB_PORT || '6381'),
      db: parseInt(process.env.REDIS_PUBSUB_DB || '0'),
      connectionString: process.env.REDIS_PUBSUB_CONNECTION_STRING || `redis://${process.env.REDIS_PUBSUB_HOST || 'localhost'}:${process.env.REDIS_PUBSUB_PORT || '6381'}/${process.env.REDIS_PUBSUB_DB || '0'}`,
    },
  };
};
