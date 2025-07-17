import { ApiResponseHelper, DateHelper, ErrorHelper, PaginationHelper, ValidationHelper } from '@two-services/shared';

describe('ApiResponseHelper', () => {
  describe('success', () => {
    it('should create a successful response with data', () => {
      const data = { id: 1, name: 'test' };
      const response = ApiResponseHelper.success(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should create a successful response with data and message', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Operation completed successfully';
      const response = ApiResponseHelper.success(data, message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
      expect(response.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('error', () => {
    it('should create an error response', () => {
      const error = 'Something went wrong';
      const response = ApiResponseHelper.error(error);

      expect(response.success).toBe(false);
      expect(response.error).toBe(error);
      expect(response.timestamp).toBeInstanceOf(Date);
    });
  });
});

describe('PaginationHelper', () => {
  describe('validatePagination', () => {
    it('should return default values for empty query', () => {
      const result = PaginationHelper.validatePagination({});
      expect(result).toEqual({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    it('should validate and normalize pagination parameters', () => {
      const query = {
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc' as const
      };
      const result = PaginationHelper.validatePagination(query);
      expect(result).toEqual({
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc'
      });
    });

    it('should enforce minimum page number', () => {
      const result = PaginationHelper.validatePagination({ page: 0 });
      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const result = PaginationHelper.validatePagination({ limit: 200 });
      expect(result.limit).toBe(100);
    });

    it('should enforce minimum limit', () => {
      const result = PaginationHelper.validatePagination({ limit: 0 });
      expect(result.limit).toBe(1);
    });

    it('should default to desc for invalid sortOrder', () => {
      const result = PaginationHelper.validatePagination({ sortOrder: 'invalid' as 'asc' | 'desc' });
      expect(result.sortOrder).toBe('desc');
    });
  });

  describe('calculateSkip', () => {
    it('should calculate correct skip value', () => {
      expect(PaginationHelper.calculateSkip(1, 10)).toBe(0);
      expect(PaginationHelper.calculateSkip(2, 10)).toBe(10);
      expect(PaginationHelper.calculateSkip(3, 20)).toBe(40);
    });
  });

  describe('calculateTotalPages', () => {
    it('should calculate correct total pages', () => {
      expect(PaginationHelper.calculateTotalPages(100, 10)).toBe(10);
      expect(PaginationHelper.calculateTotalPages(101, 10)).toBe(11);
      expect(PaginationHelper.calculateTotalPages(0, 10)).toBe(0);
    });
  });
});

describe('DateHelper', () => {
  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(DateHelper.isValidDate(new Date())).toBe(true);
      expect(DateHelper.isValidDate(new Date('2023-01-01'))).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(DateHelper.isValidDate(new Date('invalid'))).toBe(false);
      expect(DateHelper.isValidDate('2023-01-01')).toBe(false);
      expect(DateHelper.isValidDate(null)).toBe(false);
      expect(DateHelper.isValidDate(undefined)).toBe(false);
    });
  });

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const dateString = '2023-01-01T00:00:00.000Z';
      const result = DateHelper.parseDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(dateString);
    });

    it('should return undefined for invalid date strings', () => {
      expect(DateHelper.parseDate('invalid')).toBeUndefined();
      expect(DateHelper.parseDate(undefined)).toBeUndefined();
    });
  });

  describe('formatDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(DateHelper.formatDate(date)).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('getDateRange', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-02T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return provided dates when both are given', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-01-03');
      const result = DateHelper.getDateRange(start, end);
      expect(result.start).toBe(start);
      expect(result.end).toBe(end);
    });

    it('should use 24 hours ago as default start date', () => {
      const end = new Date('2023-01-03');
      const result = DateHelper.getDateRange(undefined, end);
      expect(result.start).toEqual(new Date('2023-01-01T00:00:00.000Z'));
      expect(result.end).toBe(end);
    });

    it('should use current time as default end date', () => {
      const start = new Date('2023-01-01');
      const result = DateHelper.getDateRange(start, undefined);
      expect(result.start).toBe(start);
      expect(result.end).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    });

    it('should use default range when no dates provided', () => {
      const result = DateHelper.getDateRange();
      expect(result.start).toEqual(new Date('2023-01-01T00:00:00.000Z'));
      expect(result.end).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    });
  });
});

describe('ValidationHelper', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(ValidationHelper.validateEmail('test@example.com')).toBe(true);
      expect(ValidationHelper.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(ValidationHelper.validateEmail('user+label@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(ValidationHelper.validateEmail('invalid-email')).toBe(false);
      expect(ValidationHelper.validateEmail('user@')).toBe(false);
      expect(ValidationHelper.validateEmail('@domain.com')).toBe(false);
      expect(ValidationHelper.validateEmail('user@domain')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(ValidationHelper.validateUrl('https://example.com')).toBe(true);
      expect(ValidationHelper.validateUrl('http://localhost:3000')).toBe(true);
      expect(ValidationHelper.validateUrl('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(ValidationHelper.validateUrl('not-a-url')).toBe(false);
      expect(ValidationHelper.validateUrl('://invalid')).toBe(false);
      expect(ValidationHelper.validateUrl('')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should validate file sizes within limits', () => {
      expect(ValidationHelper.validateFileSize(1000, 2000)).toBe(true);
      expect(ValidationHelper.validateFileSize(2000, 2000)).toBe(true);
    });

    it('should reject file sizes outside limits', () => {
      expect(ValidationHelper.validateFileSize(3000, 2000)).toBe(false);
      expect(ValidationHelper.validateFileSize(0, 2000)).toBe(false);
      expect(ValidationHelper.validateFileSize(-1, 2000)).toBe(false);
    });
  });

  describe('validateMimeType', () => {
    it('should validate allowed MIME types', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      expect(ValidationHelper.validateMimeType('image/jpeg', allowedTypes)).toBe(true);
      expect(ValidationHelper.validateMimeType('application/pdf', allowedTypes)).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      const allowedTypes = ['image/jpeg', 'image/png'];
      expect(ValidationHelper.validateMimeType('application/pdf', allowedTypes)).toBe(false);
      expect(ValidationHelper.validateMimeType('text/plain', allowedTypes)).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filenames', () => {
      expect(ValidationHelper.sanitizeFilename('file name.txt')).toBe('file_name.txt');
      expect(ValidationHelper.sanitizeFilename('file/with\\slashes.pdf')).toBe('file_with_slashes.pdf');
      expect(ValidationHelper.sanitizeFilename('file:with*special<chars>.doc')).toBe('file_with_special_chars_.doc');
    });

    it('should preserve valid characters', () => {
      expect(ValidationHelper.sanitizeFilename('valid_file-name.txt')).toBe('valid_file-name.txt');
      expect(ValidationHelper.sanitizeFilename('file123.pdf')).toBe('file123.pdf');
    });
  });
});

describe('ErrorHelper', () => {
  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error message');
      expect(ErrorHelper.formatError(error)).toBe('Test error message');
    });

    it('should format string errors', () => {
      expect(ErrorHelper.formatError('String error')).toBe('String error');
    });

    it('should format unknown errors', () => {
      expect(ErrorHelper.formatError({ unknown: 'object' })).toBe('Unknown error occurred');
      expect(ErrorHelper.formatError(null)).toBe('Unknown error occurred');
      expect(ErrorHelper.formatError(undefined)).toBe('Unknown error occurred');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      expect(ErrorHelper.isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(ErrorHelper.isRetryableError(new Error('ENOTFOUND'))).toBe(true);
      expect(ErrorHelper.isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(ErrorHelper.isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(ErrorHelper.isRetryableError(new Error('Validation failed'))).toBe(false);
      expect(ErrorHelper.isRetryableError(new Error('Not found'))).toBe(false);
      expect(ErrorHelper.isRetryableError('String error')).toBe(false);
      expect(ErrorHelper.isRetryableError(null)).toBe(false);
    });
  });
});
