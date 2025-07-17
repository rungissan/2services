import { Module } from '@nestjs/common';
// import { PDFGeneratorClient } from '@two-services/shared';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingService } from './logging.service';
import { LogsController } from './logs.controller';
// import { PDFReportController } from './pdf-report.controller';
import { PdfReportService } from './pdf-report.service';
import { RedisSubscriberService } from './redis-subscriber.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [],
  controllers: [AppController, LogsController, ReportsController /*, PDFReportController*/],
  providers: [
    AppService,
    LoggingService,
    RedisSubscriberService,
    PdfReportService,
    // PDFGeneratorClient
  ],
})
export class AppModule {}
