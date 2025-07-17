import { Module } from '@nestjs/common';
import { SharedServicesModule } from '@two-services/shared';
import { AppController } from './app.controller';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [SharedServicesModule, ServicesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
