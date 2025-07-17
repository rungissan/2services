import { Test, TestingModule } from '@nestjs/testing';
import { Collection, Db, MongoClient } from 'mongodb';
import { LoggingService } from './logging.service';

// Mock MongoDB
jest.mock('mongodb');
const MockedMongoClient = MongoClient as jest.MockedClass<typeof MongoClient>;

describe('LoggingService', () => {
  let service: LoggingService;
  let mockClient: jest.Mocked<MongoClient>;
  let mockDb: jest.Mocked<Db>;
  let mockCollection: jest.Mocked<Pick<Collection, 'insertOne' | 'find' | 'countDocuments' | 'createIndex'>>;

  beforeEach(async () => {
    mockCollection = {
      insertOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      createIndex: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as unknown as jest.Mocked<Db>;

    mockClient = {
      connect: jest.fn(),
      close: jest.fn(),
      db: jest.fn().mockReturnValue(mockDb),
    } as unknown as jest.Mocked<MongoClient>;

    MockedMongoClient.mockImplementation(() => mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingService],
    }).compile();

    service = module.get<LoggingService>(LoggingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to MongoDB and create indexes', async () => {
      await service.onModuleInit();

      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ eventType: 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ source: 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ filename: 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ eventType: 1, timestamp: -1 });
    });
  });

  describe('logEvent', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should insert event into MongoDB', async () => {
      const logEvent = {
        eventType: 'file-upload',
        timestamp: new Date(),
        source: 'serviceA',
        filename: 'test.json',
        metadata: { test: 'data' },
        data: { uploaded: true },
      };

      await service.logEvent(logEvent);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(logEvent);
    });

    it('should handle insertion errors', async () => {
      const logEvent = {
        eventType: 'file-upload',
        timestamp: new Date(),
        source: 'serviceA',
        metadata: { test: 'data' },
      };

      mockCollection.insertOne.mockRejectedValue(new Error('Database error'));

      await expect(service.logEvent(logEvent)).rejects.toThrow('Database error');
    });
  });

  describe('queryLogs', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should query logs with default parameters', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };

      mockCollection.find.mockReturnValue(mockFind as unknown as ReturnType<Collection['find']>);
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await service.queryLogs({});

      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockFind.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(100);
      expect(result).toEqual({
        events: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });
    });

    it('should query logs with filters', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };

      mockCollection.find.mockReturnValue(mockFind as unknown as ReturnType<Collection['find']>);
      mockCollection.countDocuments.mockResolvedValue(0);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');

      await service.queryLogs({
        eventType: 'file-upload',
        source: 'serviceA',
        startDate,
        endDate,
        page: 2,
        limit: 50,
      });

      expect(mockCollection.find).toHaveBeenCalledWith({
        eventType: 'file-upload',
        source: 'serviceA',
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });
      expect(mockFind.skip).toHaveBeenCalledWith(50);
      expect(mockFind.limit).toHaveBeenCalledWith(50);
    });

    it('should handle query errors', async () => {
      mockCollection.find.mockImplementation(() => {
        throw new Error('Query error');
      });

      await expect(service.queryLogs({})).rejects.toThrow('Query error');
    });
  });

  describe('getEventsByDateRange', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should get events by date range', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };

      mockCollection.find.mockReturnValue(mockFind as unknown as ReturnType<Collection['find']>);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');

      await service.getEventsByDateRange(startDate, endDate);

      expect(mockCollection.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });
      expect(mockFind.sort).toHaveBeenCalledWith({ timestamp: -1 });
    });

    it('should handle date range query errors', async () => {
      mockCollection.find.mockImplementation(() => {
        throw new Error('Date range query error');
      });

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');

      await expect(service.getEventsByDateRange(startDate, endDate))
        .rejects.toThrow('Date range query error');
    });
  });

  describe('onModuleDestroy', () => {
    it('should close MongoDB connection', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockClient.close).toHaveBeenCalled();
    });
  });
});
