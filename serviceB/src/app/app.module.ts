import { Module } from '@nestjs/common';
// import { PDFGeneratorClient } from '@two-services/shared';
import { MongoService } from '@two-services/shared';
import { AppController } from './app.controller';
import { LogsController } from './logs.controller';
// import { PDFReportController } from './pdf-report.controller';
import { ReportsController } from './reports.controller';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [AppController, LogsController, ReportsController /*, PDFReportController*/],
  providers: [
    MongoService,
    // PDFGeneratorClient
  ],
})
export class AppModule {}
