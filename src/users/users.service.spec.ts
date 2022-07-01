import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/database/prisma.service';
import { UsersService } from './users.service';
import { getLoggerToken } from 'nestjs-pino';
import { CryptoService } from '../common/security/crypto.service';
import { Web3Service } from '../common/web3/web3.service';
import { BadRequestException } from '@nestjs/common';

describe(UsersService.name, () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            userWalletLogin: {
              findUnique: jest.fn(val => {
                if (
                  val &&
                  val.where &&
                  val.where.publicAddress &&
                  val.where.publicAddress === '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
                ) {
                  return {
                    publicAddress: val.where.publicAddress,
                    nonce: 'nonce',
                  };
                }

                return null;
              }),
            },
            user: {
              create: jest.fn(val => {
                if (val && val.data && val.data.userWalletLogin) {
                  return {
                    ...val.data,
                    userWalletLogin: {
                      ...val.data.userWalletLogin.create,
                    },
                  };
                }

                return null;
              }),
              findUnique: jest.fn(val => {
                if (val && val.where) {
                  if (val.where.id === '123') {
                    return { id: '123' };
                  } else if (val.where.username === 'fujiwara_takumi') {
                    return { username: 'fujiwara_takumi' };
                  }
                }

                return null;
              }),
            },
          },
        },
        Web3Service,
        {
          provide: CryptoService,
          useValue: {
            generate256BitSecret: jest.fn(() => '123'),
          },
        },
        {
          provide: getLoggerToken(UsersService.name),
          useValue: null,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should get user by id', async () => {
    // arrange
    const userId = '123';

    // act
    const user = await service.getUserById(userId);

    // assert
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user?.id).toBe(userId);
  });

  it('should not get user by id', async () => {
    // arrange
    const userId = 'NOT_EXISTING_USER_ID';

    // act
    const user = await service.getUserById(userId);

    // assert
    expect(user).toBeNull();
  });

  it('should get username', async () => {
    // arrange
    const username = 'fujiwara_takumi';

    // act
    const user = await service.getUserByUsername(username);

    // assert
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user?.username).toBe(username);
  });

  it('should not get username', async () => {
    // arrange
    const username = 'NOT_EXISTING_USERNAME';

    // act
    const user = await service.getUserByUsername(username);

    // assert
    expect(user).toBeNull();
  });

  it('should create web3 login', async () => {
    // arrange
    const address = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

    // act
    const userWalletLogin = await service.createWeb3Login(address);

    // assert
    expect(userWalletLogin).toBeDefined();
    expect(userWalletLogin).not.toBeNull();
    expect(userWalletLogin.publicAddress).toBe(address);
    expect(userWalletLogin.nonce).toBe('123');
  });

  it('should throw invalid public adress on creating web3 login', async () => {
    // arrange
    const address = 'I like turtles!';

    // actsert
    await expect(service.createWeb3Login(address)).rejects.toThrow(BadRequestException);
  });

  it('should get wallet login by public address', async () => {
    // arrange
    const address = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

    // act
    const userWalletLogin = await service.getWalletLoginByPublicAddress(address);

    // assert
    expect(userWalletLogin).toBeDefined();
    expect(userWalletLogin).not.toBeNull();
    expect(userWalletLogin?.publicAddress).toBe(address);
    expect(userWalletLogin?.nonce).toBe('nonce');
  });

  it('should fail to find wallet login', async () => {
    // arrange
    const address = '0x0Ac1dF02185025F65202660F8167210A80dD5086';

    // act
    const userWalletLogin = await service.getWalletLoginByPublicAddress(address);

    // assert
    expect(userWalletLogin).toBeNull();
  });

  it('should fail to find wallet login by public address because address is invalid', async () => {
    // arrange
    const address = 'I like turtles!';

    // act
    await expect(service.getWalletLoginByPublicAddress(address)).rejects.toThrow(BadRequestException);
  });
});
