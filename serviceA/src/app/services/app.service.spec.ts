import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;
  let testingModule: TestingModule;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = testingModule.get<AppService>(AppService);
  });

  afterAll(async () => {
    if (testingModule) {
      await testingModule.close();
    }
  });

  describe('getData', () => {
    it('should return "Hello from ServiceA API"', () => {
      expect(service.getData()).toEqual({message: 'Hello from ServiceA API'});
    });
  });
});
