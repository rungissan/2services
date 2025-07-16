import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { PdfReportService } from './pdf-report.service';
import type { LogQuery, ReportRequest } from './types';

@Controller('logs')
export class LogsController {
  constructor(
    private loggingService: LoggingService,
    private pdfReportService: PdfReportService
  ) {}

  @Get()
  async getLogs(
    @Query('eventType') eventType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('source') source?: string,
    @Query('filename') filename?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    const query: LogQuery = {
      eventType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      source,
      filename,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy,
      sortOrder
    };

    // Validate dates
    if (query.startDate && isNaN(query.startDate.getTime())) {
      throw new BadRequestException('Invalid startDate format');
    }
    if (query.endDate && isNaN(query.endDate.getTime())) {
      throw new BadRequestException('Invalid endDate format');
    }

    return await this.loggingService.queryLogs(query);
  }

  @Get('event-types')
  async getEventTypes() {
    // This would typically be cached or computed from the logs
    return {
      eventTypes: ['file-upload', 'data-fetch', 'search-query']
    };
  }

  @Get('sources')
  async getSources() {
    // This would typically be computed from the logs
    return {
      sources: ['serviceA', 'external-api', 'file-system']
    };
  }
}

@Controller('reports')
export class ReportsController {
  constructor(private pdfReportService: PdfReportService) {}

  @Post('generate')
  async generateReport(@Body() request: ReportRequest) {
    // Validate request
    if (!request.startDate || !request.endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const reportPath = await this.pdfReportService.generateReport({
      startDate,
      endDate,
      metrics: request.metrics || [],
      format: request.format || 'pdf'
    });

    return {
      message: 'Report generated successfully',
      path: reportPath,
      downloadUrl: `/reports/download/${reportPath.split('/').pop()}`
    };
  }

  @Get('download/:filename')
  async downloadReport(@Param('filename') filename: string) {
    // In a real implementation, you would:
    // 1. Validate the filename
    // 2. Check if the file exists
    // 3. Return the file as a stream with proper headers

    return {
      message: 'Download endpoint - implement file streaming',
      filename
    };
  }
}
