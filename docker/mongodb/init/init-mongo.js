// MongoDB initialization script
// This script runs when the container starts for the first time

// Create application users
db = db.getSiblingDB('two-services');

// Create collections for serviceA
db.createCollection('serviceA_data');
db.createCollection('serviceA_logs');

// Create collections for serviceB
db.createCollection('serviceB_data');
db.createCollection('serviceB_logs');

// Create shared collections
db.createCollection('shared_events');
db.createCollection('user_sessions');

// Create indexes for better performance
db.serviceA_data.createIndex({ "createdAt": 1 });
db.serviceA_data.createIndex({ "userId": 1 });
db.serviceA_logs.createIndex({ "timestamp": 1 });
db.serviceA_logs.createIndex({ "level": 1 });

db.serviceB_data.createIndex({ "createdAt": 1 });
db.serviceB_data.createIndex({ "userId": 1 });
db.serviceB_logs.createIndex({ "timestamp": 1 });
db.serviceB_logs.createIndex({ "level": 1 });

db.shared_events.createIndex({ "eventType": 1 });
db.shared_events.createIndex({ "timestamp": 1 });
db.user_sessions.createIndex({ "userId": 1 });
db.user_sessions.createIndex({ "sessionId": 1 });

// Create application user with read/write permissions
db.createUser({
  user: 'app-user',
  pwd: 'app-password',
  roles: [
    {
      role: 'readWrite',
      db: 'two-services'
    }
  ]
});

print('MongoDB initialization completed successfully!');
