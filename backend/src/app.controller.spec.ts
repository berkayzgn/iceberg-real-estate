import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API metadata', () => {
      const res = appController.getRoot();
      expect(res).toMatchObject({
        name: 'estate-agency-api',
      });
    });
  });

  describe('health', () => {
    it('should return ok status', () => {
      const res = appController.getHealth();
      expect(res.status).toBe('ok');
      expect(res.timestamp).toBeDefined();
    });
  });
});
