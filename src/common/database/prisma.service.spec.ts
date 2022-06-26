import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe(PrismaService.name, () => {
  let service: PrismaService;
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    service.$connect = jest.fn();
    service.$disconnect = jest.fn();
    service.$on = jest.fn();
    app = module.createNestApplication();
    app.close = jest.fn();
  });

  it('should connect on module init', async () => {
    await service.onModuleInit();
    expect(service.$connect).toBeCalledTimes(1);
  });

  it('should disconnect on module destroy', async () => {
    await service.onModuleDestroy();
    expect(service.$disconnect).toBeCalledTimes(1);
  });

  it('should trigger beforeExit on app shutdown', async () => {
    await service.enableShutdownHooks(app);
    expect(service.$on).toBeCalledTimes(1);
  });
});
