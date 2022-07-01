import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/database/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Web3Service } from '../common/web3/web3.service';
import { getLoggerToken } from 'nestjs-pino';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        Web3Service,
        {
          provide: getLoggerToken(AuthService.name),
          useValue: null,
        },
        ConfigService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
        Web3Service,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should get existing wallet login', () => {
    expect(service).toBeDefined();
  });
});
