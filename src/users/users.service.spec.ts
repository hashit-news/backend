import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/database/prisma.service';
import { UsersService } from './users.service';
import { getLoggerToken } from 'nestjs-pino';
import { CryptoService } from '../common/security/crypto.service';
import { Web3Service } from '../common/web3/web3.service';

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
        Web3Service,
        CryptoService,
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
