import { Test, TestingModule } from '@nestjs/testing';
import { MongoService } from '@two-services/shared';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let mockMongoService: jest.Mocked<MongoService>;

  beforeEach(async () => {
    // Create a mock MongoService
    mockMongoService = {
      insertOne: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as jest.Mocked<MongoService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingService,
        { provide: MongoService, useValue: mockMongoService },
      ],
    }).compile();

    service = module.get<LoggingService>(LoggingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize the service', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.onModuleInit();

      expect(consoleSpy).toHaveBeenCalledWith('LoggingService initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('onModuleDestroy', () => {
    it('should destroy the service', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.onModuleDestroy();

      expect(consoleSpy).toHaveBeenCalledWith('LoggingService destroyed');

      consoleSpy.mockRestore();
    });
  });

  describe('logEvent', () => {
    it('should insert event into MongoDB', async () => {
      const logEvent = {
        eventType: 'file-upload',
        timestamp: new Date(),
        source: 'serviceA',
        filename: 'test.json',
        metadata: { test: 'data' },
        data: { uploaded: true },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.logEvent(logEvent);

      expect(mockMongoService.insertOne).toHaveBeenCalledWith('events', logEvent);
      expect(consoleSpy).toHaveBeenCalledWith(`Logged event: ${logEvent.eventType} from ${logEvent.source}`);

      consoleSpy.mockRestore();
    });

    it('should handle insertion errors', async () => {
      const logEvent = {
        eventType: 'file-upload',
        timestamp: new Date(),
        source: 'serviceA',
        metadata: { test: 'data' },
      };

      const error = new Error('Database error');
      mockMongoService.insertOne.mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.logEvent(logEvent)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error logging event:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('queryLogs', () => {
    it('should query logs with default parameters', async () => {
      const mockEvents = [
        { eventType: 'file-upload', source: 'serviceA', timestamp: new Date() }
      ];
      const mockTotal = 1;

      mockMongoService.findMany.mockResolvedValue(mockEvents);
      mockMongoService.count.mockResolvedValue(mockTotal);

      const result = await service.queryLogs({});

      expect(mockMongoService.findMany).toHaveBeenCalledWith('events', {}, {
        sort: { timestamp: -1 },
        skip: 0,
        limit: 100
      });
      expect(mockMongoService.count).toHaveBeenCalledWith('events', {});
      expect(result).toEqual({
        events: mockEvents,
        total: mockTotal,
        page: 1,
        limit: 100,
        totalPages: 1
      });
    });

    it('should query logs with filters', async () => {
      const mockEvents = [
        { eventType: 'file-upload', source: 'serviceA', timestamp: new Date() }
      ];
      const mockTotal = 1;

      mockMongoService.findMany.mockResolvedValue(mockEvents);
      mockMongoService.count.mockResolvedValue(mockTotal);

      const query = {
        eventType: 'file-upload',
        source: 'serviceA',
        page: 2,
        limit: 5,
        sortBy: 'eventType',
        sortOrder: 'asc' as const
      };

      const result = await service.queryLogs(query);

      expect(mockMongoService.findMany).toHaveBeenCalledWith('events', {
        eventType: 'file-upload',
        source: 'serviceA'
      }, {
        sort: { eventType: 1 },
        skip: 5,
        limit: 5
      });
      expect(mockMongoService.count).toHaveBeenCalledWith('events', {
        eventType: 'file-upload',
        source: 'serviceA'
      });
      expect(result).toEqual({
        events: mockEvents,
        total: mockTotal,
        page: 2,
        limit: 5,
        totalPages: 1
      });
    });

    it('should handle query errors', async () => {
      const error = new Error('Query error');
      mockMongoService.findMany.mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.queryLogs({})).rejects.toThrow('Query error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error querying logs:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getEventsByDateRange', () => {
    it('should get events by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockEvents = [
        { eventType: 'file-upload', source: 'serviceA', timestamp: new Date('2024-01-15') }
      ];

      mockMongoService.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsByDateRange(startDate, endDate);

      expect(mockMongoService.findMany).toHaveBeenCalledWith('events', {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }, {
        sort: { timestamp: -1 }
      });
      expect(result).toEqual(mockEvents);
    });

    it('should handle date range query errors', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const error = new Error('Date range query error');

      mockMongoService.findMany.mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.getEventsByDateRange(startDate, endDate))
        .rejects.toThrow('Date range query error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting events by date range:', error);

      consoleErrorSpy.mockRestore();
    });
  });
});
