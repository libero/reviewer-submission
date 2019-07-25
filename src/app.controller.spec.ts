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
    it('should send a good healthcheck to the user', () => {
      const mockRes = {
        status: (code: number) => ({json: (data: any) => ({code, data})}),
      };

      expect(appController.sendHealthCheck(mockRes)).resolves.toEqual({code: 200, data: {ok: true}});
    });
  });
});
