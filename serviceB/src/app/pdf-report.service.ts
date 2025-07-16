import { Injectable } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import Redis from 'ioredis';
import { join } from 'path';
import { config } from './config';
import { LoggingService } from './logging.service';
import { LogEvent, ReportRequest } from './types';

interface TimeSeriesData {
  metric: string;
  data: unknown[];
}

@Injectable()
export class PdfReportService {
  private redisClient: Redis;

  constructor(private loggingService: LoggingService) {
    this.redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
    });
  }

  async onModuleInit() {
    // Ensure reports directory exists
    await mkdir(config.pdf.outputPath, { recursive: true });
  }

  async onModuleDestroy() {
    await this.redisClient.disconnect();
  }

  async generateReport(request: ReportRequest): Promise<string> {
    const { startDate, endDate, metrics = [] } = request;

    try {
      // Get events from the date range
      const events = await this.loggingService.getEventsByDateRange(startDate, endDate);

      // Get time-series data from Redis (if RedisTimeSeries is available)
      const timeSeriesData = await this.getTimeSeriesData(startDate, endDate, metrics);

      // Generate report filename
      const filename = `report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
      const filepath = join(config.pdf.outputPath, filename);

      // Generate PDF (simplified implementation)
      await this.createPdf(filepath, events, timeSeriesData, startDate, endDate);

      return filepath;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }

  private async getTimeSeriesData(startDate: Date, endDate: Date, metrics: string[]): Promise<TimeSeriesData[]> {
    const timeSeriesData: TimeSeriesData[] = [];

    try {
      // Use RedisTimeSeries commands if available
      for (const metric of metrics) {
        const startTs = Math.floor(startDate.getTime());
        const endTs = Math.floor(endDate.getTime());

        // Example: TS.RANGE key:metric fromTimestamp toTimestamp
        const data = await this.redisClient.call('TS.RANGE', `metric:${metric}`, startTs, endTs);
        timeSeriesData.push({ metric, data: data as unknown[] });
      }
    } catch (error) {
      console.warn('RedisTimeSeries not available or error fetching data:', error);
      // Fallback to regular Redis keys or skip time-series data
    }

    return timeSeriesData;
  }

  private async createPdf(filepath: string, events: LogEvent[], timeSeriesData: TimeSeriesData[], startDate: Date, endDate: Date): Promise<void> {
    // This is a simplified implementation
    // In a real application, you would use a PDF library like jsPDF, PDFKit, or Puppeteer

    const reportContent = this.generateReportContent(events, timeSeriesData, startDate, endDate);

    // For now, we'll create a simple text-based report
    // In production, you would use a proper PDF library
    const stream = createWriteStream(filepath);
    stream.write(reportContent);
    stream.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  private generateReportContent(events: LogEvent[], timeSeriesData: TimeSeriesData[], startDate: Date, endDate: Date): string {
    const reportHeader = `
SERVICE B - LOG REPORT
======================
Period: ${startDate.toISOString()} to ${endDate.toISOString()}
Generated: ${new Date().toISOString()}

SUMMARY
-------
Total Events: ${events.length}
Event Types: ${[...new Set(events.map(e => e.eventType))].join(', ')}

`;

    const eventsSummary = events.map(event => `
Event Type: ${event.eventType}
Timestamp: ${event.timestamp}
Source: ${event.source}
Filename: ${event.filename || 'N/A'}
---
`).join('\n');

    const timeSeriesSummary = timeSeriesData.map(ts => `
Metric: ${ts.metric}
Data Points: ${ts.data ? ts.data.length : 0}
---
`).join('\n');

    return `${reportHeader}

EVENTS
------
${eventsSummary}

TIME SERIES DATA
---------------
${timeSeriesSummary}

End of Report
`;
  }
}
