import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPublisherService } from './event-publisher.service';

@Module({
  providers: [AppService, EventPublisherService],
  exports: [AppService, EventPublisherService],
})
export class ServicesModule {}
