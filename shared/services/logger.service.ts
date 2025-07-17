import { Injectable } from '@nestjs/common';
import { getBaseConfig } from '../config/app.config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable()
export class LoggerService {
  private config = getBaseConfig();
  private serviceName: string;

  constructor() {
    // Auto-detect service name from various sources
    this.serviceName = this.detectServiceName();
  }

  private detectServiceName(): string {
    // Try multiple methods to detect the service name
    if (process.env.SERVICE_NAME) {
      return process.env.SERVICE_NAME;
    }

    // Check process arguments
    const args = process.argv.join(' ');
    if (args.includes('serviceA')) {
      return 'serviceA';
    }
    if (args.includes('serviceB')) {
      return 'serviceB';
    }

    // Check working directory
    const cwd = process.cwd();
    if (cwd.includes('serviceA')) {
      return 'serviceA';
    }
    if (cwd.includes('serviceB')) {
      return 'serviceB';
    }

    return 'unknown-service';
  }

  setServiceName(serviceName: string): void {
    this.serviceName = serviceName;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, meta);
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      this.log('info', message, meta);
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, meta);
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const errorMeta = error ? { error: error.message, stack: error.stack } : {};
      this.log('error', message, { ...errorMeta, ...meta });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevel = this.config.logging.level;

    return levels.indexOf(level) >= levels.indexOf(configLevel);
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const logEntry = {
      level,
      message,
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      ...meta
    };

    if (this.config.logging.enableConsole) {
      this.logToConsole(level, logEntry);
    }

    if (this.config.logging.enableFile) {
      this.logToFile(logEntry);
    }
  }

  private logToConsole(level: LogLevel, logEntry: Record<string, unknown>): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m'  // Red
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';

    console.log(`${color}[${logEntry.timestamp}] ${level.toUpperCase()} [${logEntry.service}]: ${logEntry.message}${reset}`);

    if (logEntry.error) {
      console.error(`${color}Error: ${logEntry.error}${reset}`);
    }

    if (logEntry.stack) {
      console.error(`${color}Stack: ${logEntry.stack}${reset}`);
    }
  }

  private logToFile(logEntry: Record<string, unknown>): void {
    // In a real implementation, you would write to a file
    // For now, we'll just store the log entry format
    console.log('[FILE LOG]', JSON.stringify(logEntry));
  }
}
