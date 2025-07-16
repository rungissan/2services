import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogsController, ReportsController } from './controllers';
import { LoggingService } from './logging.service';
import { PdfReportService } from './pdf-report.service';
import { RedisSubscriberService } from './redis-subscriber.service';

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
