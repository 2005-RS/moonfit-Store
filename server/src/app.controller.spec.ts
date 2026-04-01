import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  const prismaMock = {
    getHealthStatus: jest.fn().mockResolvedValue({
      status: 'ok',
      provider: 'sqlserver',
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return backend info', () => {
      expect(appController.getApiInfo()).toEqual(
        expect.objectContaining({
          name: 'eccomers-api',
          status: 'ok',
        }),
      );
    });

    it('should return health info with database status', async () => {
      await expect(appController.getHealth()).resolves.toEqual(
        expect.objectContaining({
          status: 'ok',
          service: 'eccomers-api',
          database: {
            status: 'ok',
            provider: 'sqlserver',
          },
        }),
      );
    });
  });
});
