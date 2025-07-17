import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@two-services/shared';
import Redis from 'ioredis';
import { EventPublisherService } from './event-publisher.service';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('EventPublisherService', () => {
  let service: EventPublisherService;
  let testingModule: TestingModule;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockRedisClient: jest.Mocked<Pick<Redis, 'publish' | 'disconnect'>>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockRedisClient = {
      publish: jest.fn(),
      disconnect: jest.fn(),
    };

    MockedRedis.mockImplementation(() => mockRedisClient as unknown as Redis);

    mockRedisService = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    testingModule = await Test.createTestingModule({
      providers: [
        EventPublisherService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    testingModule = await Test.createTestingModule({
      providers: [
        EventPublisherService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = testingModule.get<EventPublisherService>(EventPublisherService);

    // Suppress console output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Close the testing module to clean up resources
    if (testingModule) {
      await testingModule.close();
    }
  });

  describe('publishFileUploadEvent', () => {
    it('should publish file upload event to correct channel', async () => {
      const eventData = {
        source: 'serviceA',
        filename: 'test.json',
        fileSize: 1024,
        mimeType: 'application/json',
        uploadPath: '/uploads/test.json',
        data: { uploaded: true },
      };

      await service.publishFileUploadEvent(eventData);

      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'file-upload',
        expect.stringContaining('"eventType":"file-upload"')
      );
      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'file-upload',
        expect.stringContaining('"filename":"test.json"')
      );
    });

    it('should include timestamp in published event', async () => {
      const eventData = {
        source: 'serviceA',
        filename: 'test.json',
        fileSize: 1024,
        mimeType: 'application/json',
        uploadPath: '/uploads/test.json',
        data: { uploaded: true },
      };

      await service.publishFileUploadEvent(eventData);

      const publishedData = String(mockRedisService.publish.mock.calls[0][1]);
      const parsedData = JSON.parse(publishedData);
      expect(parsedData.timestamp).toBeDefined();
      expect(new Date(parsedData.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle publish errors', async () => {
      const eventData = {
        source: 'serviceA',
        filename: 'test.json',
        fileSize: 1024,
        mimeType: 'application/json',
        uploadPath: '/uploads/test.json',
        data: { uploaded: true },
      };

      mockRedisService.publish.mockRejectedValue(new Error('Redis error'));

      await expect(service.publishFileUploadEvent(eventData)).rejects.toThrow('Redis error');
    });
  });

  describe('publishDataFetchEvent', () => {
    it('should publish data fetch event to correct channel', async () => {
      const eventData = {
        source: 'serviceA',
        url: 'https://api.example.com/data',
        status: 'success' as const,
        recordCount: 100,
        data: { fetched: true },
      };

      await service.publishDataFetchEvent(eventData);

      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'data-fetch',
        expect.stringContaining('"eventType":"data-fetch"')
      );
      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'data-fetch',
        expect.stringContaining('"status":"success"')
      );
    });

    it('should handle error status', async () => {
      const eventData = {
        source: 'serviceA',
        url: 'https://api.example.com/data',
        status: 'error' as const,
        errorMessage: 'Failed to fetch data',
        data: { error: true },
      };

      await service.publishDataFetchEvent(eventData);

      const publishedData = String(mockRedisService.publish.mock.calls[0][1]);
      const parsedData = JSON.parse(publishedData);
      expect(parsedData.status).toBe('error');
      expect(parsedData.errorMessage).toBe('Failed to fetch data');
    });
  });

  describe('publishSearchQueryEvent', () => {
    it('should publish search query event to correct channel', async () => {
      const eventData = {
        source: 'serviceA',
        query: 'search term',
        resultsCount: 42,
        executionTime: 150,
        data: { search: true },
      };

      await service.publishSearchQueryEvent(eventData);

      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'search-query',
        expect.stringContaining('"eventType":"search-query"')
      );
      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'search-query',
        expect.stringContaining('"query":"search term"')
      );
    });

    it('should include execution metrics', async () => {
      const eventData = {
        source: 'serviceA',
        query: 'search term',
        resultsCount: 42,
        executionTime: 150,
        data: { search: true },
      };

      await service.publishSearchQueryEvent(eventData);

      const publishedData = String(mockRedisService.publish.mock.calls[0][1]);
      const parsedData = JSON.parse(publishedData);
      expect(parsedData.resultsCount).toBe(42);
      expect(parsedData.executionTime).toBe(150);
    });
  });
});
