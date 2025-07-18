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

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('getData', () => {
    it('should return "Hello from ServiceA API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({message: 'Hello from ServiceA API'});
    });
  });
});
