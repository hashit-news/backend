import { UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleType } from '@prisma/client';
import authConfig from '../common/config/auth.config';
import { PrismaService } from '../common/database/prisma.service';
import { CryptoService } from '../common/security/crypto.service';
import { TimeService } from '../common/time/time.service';
import { Web3Service } from '../common/web3/web3.service';
import { UserDto } from '../users/user.models';
import { UsersService } from '../users/users.service';
import { JwtPayloadDto } from './auth.models';
import { JwtStrategy } from './jwt.strategy';

describe(JwtStrategy.name, () => {
  let strategy: JwtStrategy;
  let userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [authConfig] })],
      providers: [
        JwtStrategy,
        UsersService,
        Web3Service,
        CryptoService,
        TimeService,
        { provide: PrismaService, useValue: null },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UsersService>(UsersService);
  });

  it('should validate payload', async () => {
    // arrange
    const payload: JwtPayloadDto = {
      sub: '1',
    };

    const user: UserDto = {
      id: '1',
      roles: [RoleType.User],
    };

    jest.spyOn(userService, 'getUserRequestDataById').mockImplementation(async () => user);

    // act
    const result = await strategy.validate(payload);

    // assert
    expect(result).toEqual(user);
  });

  it('should not validate - user not found', async () => {
    // arrange
    const payload: JwtPayloadDto = {
      sub: '1',
    };

    jest.spyOn(userService, 'getUserRequestDataById').mockImplementation(async () => null);

    // actsert
    await expect(strategy.validate(payload)).rejects.toThrowError(UnauthorizedException);
  });
});
