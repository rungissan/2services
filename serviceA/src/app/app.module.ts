import { Module } from '@nestjs/common';
import { RedisService } from '@two-services/shared';
import { AppController } from './app.controller';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [AppController],
  providers: [RedisService],
})
export class AppModule {}
