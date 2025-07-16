import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return service information', () => {
      expect(service.getData()).toEqual({
        message: 'Hello from ServiceB API',
        service: 'Logger & Reporter Service',
        features: [
          'Redis Event Subscription',
          'MongoDB Event Logging',
          'Log Query API',
          'PDF Report Generation'
        ]
      });
    });
  });
});
