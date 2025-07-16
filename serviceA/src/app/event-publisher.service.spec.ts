import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { EventPublisherService } from './event-publisher.service';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('EventPublisherService', () => {
  let service: EventPublisherService;
  let mockRedisClient: jest.Mocked<Pick<Redis, 'publish' | 'disconnect'>>;

  beforeEach(async () => {
    mockRedisClient = {
      publish: jest.fn(),
      disconnect: jest.fn(),
    };

    MockedRedis.mockImplementation(() => mockRedisClient as unknown as Redis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventPublisherService],
    }).compile();

    service = module.get<EventPublisherService>(EventPublisherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'file-upload',
        expect.stringContaining('"eventType":"file-upload"')
      );
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
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

      const publishedData = String(mockRedisClient.publish.mock.calls[0][1]);
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

      mockRedisClient.publish.mockRejectedValue(new Error('Redis error'));

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

      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'data-fetch',
        expect.stringContaining('"eventType":"data-fetch"')
      );
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
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

      const publishedData = String(mockRedisClient.publish.mock.calls[0][1]);
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

      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'search-query',
        expect.stringContaining('"eventType":"search-query"')
      );
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
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

      const publishedData = String(mockRedisClient.publish.mock.calls[0][1]);
      const parsedData = JSON.parse(publishedData);
      expect(parsedData.resultsCount).toBe(42);
      expect(parsedData.executionTime).toBe(150);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect Redis client on module destroy', async () => {
      await service.onModuleDestroy();
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });
});
