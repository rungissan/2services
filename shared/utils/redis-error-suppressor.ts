// Suppress ioredis authentication errors during startup
import { EventEmitter } from 'events';

// Increase the max listeners to prevent memory leak warnings
EventEmitter.defaultMaxListeners = 20;

// Suppress ioredis NOAUTH errors that happen during connection initialization
const originalEmit = EventEmitter.prototype.emit;
EventEmitter.prototype.emit = function(event: string | symbol, ...args: unknown[]) {
  // Check if this is an unhandled error event with Redis authentication issues
  if (event === 'error' && args[0] && typeof args[0] === 'object') {
    const error = args[0] as { message?: string };
    if (error.message && (error.message.includes('NOAUTH') || error.message.includes('Authentication required'))) {
      // Silently suppress these specific Redis authentication errors
      return false;
    }
  }

  return originalEmit.apply(this, [event, ...args]);
};

export { };

