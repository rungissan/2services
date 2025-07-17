import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { LoggingService } from './logging.service';
import { RedisSubscriberService } from './redis-subscriber.service';

// Mock Redis and LoggingService
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('RedisSubscriberService', () => {
  let service: RedisSubscriberService;
  let mockRedisClient: jest.Mocked<Pick<Redis, 'subscribe' | 'on' | 'disconnect'>>;
  let mockLoggingService: jest.Mocked<LoggingService>;

  beforeEach(async () => {
    mockRedisClient = {
      subscribe: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    mockLoggingService = {
      logEvent: jest.fn(),
    } as unknown as jest.Mocked<LoggingService>;

    MockedRedis.mockImplementation(() => mockRedisClient as unknown as Redis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisSubscriberService,
        { provide: LoggingService, useValue: mockLoggingService },
      ],
    }).compile();

    service = module.get<RedisSubscriberService>(RedisSubscriberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should subscribe to Redis channels', async () => {
      await service.onModuleInit();

      expect(mockRedisClient.subscribe).toHaveBeenCalledWith(
        'file-upload',
        'data-fetch',
        'search-query'
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('handleEvent', () => {
    it('should handle file upload event', async () => {
      await service.onModuleInit();

      // Get the message handler
      const messageHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      expect(messageHandler).toBeDefined();

      // Simulate receiving a message
      const eventData = {
        source: 'serviceA',
        filename: 'test.json',
        fileSize: 1024,
        metadata: { test: 'metadata' },
        data: { test: 'data' }
      };

      await messageHandler?.('file-upload', JSON.stringify(eventData));

      expect(mockLoggingService.logEvent).toHaveBeenCalledWith({
        eventType: 'file-upload',
        timestamp: expect.any(Date),
        source: 'serviceA',
        filename: 'test.json',
        metadata: {
          channel: 'file-upload',
          test: 'metadata',
        },
        data: { test: 'data' },
      });
    });

    it('should handle data fetch event', async () => {
      await service.onModuleInit();

      const messageHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const eventData = {
        source: 'serviceA',
        url: 'https://api.example.com/data',
        status: 'success',
        recordCount: 100,
        data: { fetched: true }
      };

      await messageHandler?.('data-fetch', JSON.stringify(eventData));

      expect(mockLoggingService.logEvent).toHaveBeenCalledWith({
        eventType: 'data-fetch',
        timestamp: expect.any(Date),
        source: 'serviceA',
        filename: undefined,
        metadata: {
          channel: 'data-fetch',
        },
        data: { fetched: true },
      });
    });

    it('should handle search query event', async () => {
      await service.onModuleInit();

      const messageHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const eventData = {
        source: 'serviceA',
        query: 'search term',
        resultsCount: 42,
        executionTime: 150,
        data: { search: true }
      };

      await messageHandler?.('search-query', JSON.stringify(eventData));

      expect(mockLoggingService.logEvent).toHaveBeenCalledWith({
        eventType: 'search-query',
        timestamp: expect.any(Date),
        source: 'serviceA',
        filename: undefined,
        metadata: {
          channel: 'search-query',
        },
        data: { search: true },
      });
    });

    it('should handle malformed JSON messages', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.onModuleInit();

      const messageHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      await messageHandler?.('file-upload', 'invalid json');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing Redis message:',
        expect.any(Error)
      );
      expect(mockLoggingService.logEvent).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle logging service errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLoggingService.logEvent.mockRejectedValue(new Error('Logging failed'));

      await service.onModuleInit();

      const messageHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const eventData = {
        source: 'serviceA',
        data: { test: 'data' }
      };

      await messageHandler?.('file-upload', JSON.stringify(eventData));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing Redis message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle events with missing source', async () => {
      await service.onModuleInit();

      const messageHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const eventData = {
        data: { test: 'data' }
      };

      await messageHandler?.('file-upload', JSON.stringify(eventData));

      expect(mockLoggingService.logEvent).toHaveBeenCalledWith({
        eventType: 'file-upload',
        timestamp: expect.any(Date),
        source: 'unknown',
        filename: undefined,
        metadata: {
          channel: 'file-upload',
        },
        data: { test: 'data' },
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect Redis client', async () => {
      await service.onModuleDestroy();
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });
});
