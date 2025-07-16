import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportRequest } from './common-types';
import { LogsController, ReportsController } from './controllers';
import { LoggingService } from './logging.service';
import { PdfReportService } from './pdf-report.service';

describe('LogsController', () => {
  let controller: LogsController;
  let mockLoggingService: jest.Mocked<LoggingService>;

  beforeEach(async () => {
    mockLoggingService = {
      queryLogs: jest.fn(),
    } as unknown as jest.Mocked<LoggingService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: PdfReportService, useValue: {} },
      ],
    }).compile();

    controller = module.get<LogsController>(LogsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogs', () => {
    it('should query logs with default parameters', async () => {
      const mockResult = {
        events: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockLoggingService.queryLogs.mockResolvedValue(mockResult);

      const result = await controller.getLogs();

      expect(mockLoggingService.queryLogs).toHaveBeenCalledWith({
        eventType: undefined,
        startDate: undefined,
        endDate: undefined,
        source: undefined,
        filename: undefined,
        page: undefined,
        limit: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(result).toEqual(mockResult);
    });

    it('should query logs with all parameters', async () => {
      const mockResult = {
        events: [],
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 0,
      };

      mockLoggingService.queryLogs.mockResolvedValue(mockResult);

      const result = await controller.getLogs(
        'file-upload',
        '2023-01-01',
        '2023-01-02',
        'serviceA',
        'test.json',
        '2',
        '20',
        'timestamp',
        'asc'
      );

      expect(mockLoggingService.queryLogs).toHaveBeenCalledWith({
        eventType: 'file-upload',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
        source: 'serviceA',
        filename: 'test.json',
        page: 2,
        limit: 20,
        sortBy: 'timestamp',
        sortOrder: 'asc',
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle invalid start date', async () => {
      await expect(
        controller.getLogs('file-upload', 'invalid-date')
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getLogs('file-upload', 'invalid-date')
      ).rejects.toThrow('Invalid startDate format');
    });

    it('should handle invalid end date', async () => {
      await expect(
        controller.getLogs('file-upload', '2023-01-01', 'invalid-date')
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getLogs('file-upload', '2023-01-01', 'invalid-date')
      ).rejects.toThrow('Invalid endDate format');
    });
  });

  describe('getEventTypes', () => {
    it('should return available event types', async () => {
      const result = await controller.getEventTypes();
      expect(result).toEqual({
        eventTypes: ['file-upload', 'data-fetch', 'search-query']
      });
    });
  });

  describe('getSources', () => {
    it('should return available sources', async () => {
      const result = await controller.getSources();
      expect(result).toEqual({
        sources: ['serviceA', 'external-api', 'file-system']
      });
    });
  });
});

describe('ReportsController', () => {
  let controller: ReportsController;
  let mockPdfReportService: jest.Mocked<PdfReportService>;

  beforeEach(async () => {
    mockPdfReportService = {
      generateReport: jest.fn(),
    } as unknown as jest.Mocked<PdfReportService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: PdfReportService, useValue: mockPdfReportService },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate report with valid request', async () => {
      const reportRequest = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
        metrics: ['metric1', 'metric2'],
        format: 'pdf' as const,
      };

      mockPdfReportService.generateReport.mockResolvedValue('/path/to/report.pdf');

      const result = await controller.generateReport(reportRequest);

      expect(mockPdfReportService.generateReport).toHaveBeenCalledWith({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
        metrics: ['metric1', 'metric2'],
        format: 'pdf',
      });

      expect(result).toEqual({
        message: 'Report generated successfully',
        path: '/path/to/report.pdf',
        downloadUrl: '/reports/download/report.pdf',
      });
    });

    it('should generate report with default values', async () => {
      const reportRequest = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
      };

      mockPdfReportService.generateReport.mockResolvedValue('/path/to/report.pdf');

      const result = await controller.generateReport(reportRequest);

      expect(mockPdfReportService.generateReport).toHaveBeenCalledWith({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
        metrics: [],
        format: 'pdf',
      });

      expect(result).toEqual({
        message: 'Report generated successfully',
        path: '/path/to/report.pdf',
        downloadUrl: '/reports/download/report.pdf',
      });
    });

    it('should throw BadRequestException for missing startDate', async () => {
      const reportRequest = {
        endDate: new Date('2023-01-02'),
      };

      await expect(
        controller.generateReport(reportRequest as ReportRequest)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.generateReport(reportRequest as ReportRequest)
      ).rejects.toThrow('startDate and endDate are required');
    });

    it('should throw BadRequestException for missing endDate', async () => {
      const reportRequest = {
        startDate: new Date('2023-01-01'),
      };

      await expect(
        controller.generateReport(reportRequest as ReportRequest)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.generateReport(reportRequest as ReportRequest)
      ).rejects.toThrow('startDate and endDate are required');
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const reportRequest = {
        startDate: new Date('invalid-date'),
        endDate: new Date('2023-01-02'),
      };

      await expect(
        controller.generateReport(reportRequest as ReportRequest)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.generateReport(reportRequest as ReportRequest)
      ).rejects.toThrow('Invalid date format');
    });

    it('should throw BadRequestException when startDate >= endDate', async () => {
      const reportRequest = {
        startDate: new Date('2023-01-02'),
        endDate: new Date('2023-01-01'),
      };

      await expect(
        controller.generateReport(reportRequest)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.generateReport(reportRequest)
      ).rejects.toThrow('startDate must be before endDate');
    });
  });

  describe('downloadReport', () => {
    it('should return download information', async () => {
      const result = await controller.downloadReport('test-report.pdf');

      expect(result).toEqual({
        message: 'Download endpoint - implement file streaming',
        filename: 'test-report.pdf',
      });
    });
  });
});
