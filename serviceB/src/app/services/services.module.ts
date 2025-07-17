import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggingService } from './logging.service';
import { PdfReportService } from './pdf-report.service';
import { RedisSubscriberService } from './redis-subscriber.service';

@Module({
  providers: [
    AppService,
    LoggingService,
    PdfReportService,
    RedisSubscriberService,
  ],
  exports: [
    AppService,
    LoggingService,
    PdfReportService,
    RedisSubscriberService,
  ],
})
export class ServicesModule {}
