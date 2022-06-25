import { Test, TestingModule } from '@nestjs/testing';
import { Web3Service } from '../web3/web3.service';
import { PrismaService } from '../common/database/prisma.service';
import { UsersService } from './users.service';
import { getLoggerToken } from 'nestjs-pino';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
        {
          provide: Web3Service,
          useValue: {},
        },
        {
          provide: getLoggerToken(UsersService.name),
          useValue: null,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
