import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingService } from './logging.service';
import { LogsController } from './logs.controller';
import { PdfReportService } from './pdf-report.service';
import { RedisSubscriberService } from './redis-subscriber.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [],
  controllers: [AppController, LogsController, ReportsController],
  providers: [
    AppService,
    LoggingService,
    RedisSubscriberService,
    PdfReportService
  ],
})
export class AppModule {}
