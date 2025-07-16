import { ApiResponse, PaginationQuery } from './common-types';

export class ApiResponseHelper {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date()
    };
  }

  static error(error: string): ApiResponse {
    return {
      success: false,
      error,
      timestamp: new Date()
    };
  }
}

export class PaginationHelper {
  static validatePagination(query: PaginationQuery): Required<PaginationQuery> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }
}

export class DateHelper {
  static isValidDate(date: unknown): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }

  static parseDate(dateString: string | undefined): Date | undefined {
    if (!dateString) return undefined;

    const date = new Date(dateString);
    return this.isValidDate(date) ? date : undefined;
  }

  static formatDate(date: Date): string {
    return date.toISOString();
  }

  static getDateRange(startDate?: Date, endDate?: Date): { start: Date; end: Date } {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const end = endDate || now;

    return { start, end };
  }
}

export class ValidationHelper {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateFileSize(size: number, maxSize: number): boolean {
    return size > 0 && size <= maxSize;
  }

  static validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
  }

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}

export class ErrorHelper {
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  static isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const retryableMessages = [
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ECONNREFUSED'
      ];
      return retryableMessages.some(msg => error.message.includes(msg));
    }
    return false;
  }
}
