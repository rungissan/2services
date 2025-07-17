import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './services/app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('getData', () => {
    it('should return service information', () => {
      const appController = app.get<AppController>(AppController);
      const expectedResponse = {
        message: 'Hello from ServiceB API',
        service: 'Logger & Reporter Service',
        features: [
          'Redis Event Subscription',
          'MongoDB Event Logging',
          'Log Query API',
          'PDF Report Generation'
        ]
      };
      expect(appController.getData()).toEqual(expectedResponse);
    });
  });
});
