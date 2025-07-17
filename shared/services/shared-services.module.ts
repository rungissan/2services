import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { MongoService } from './mongo.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    RedisService,
    MongoService,
    LoggerService,
  ],
  exports: [
    RedisService,
    MongoService,
    LoggerService,
  ],
})
export class SharedServicesModule {}
