import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/database/prisma.service';
import { UsersService } from './users.service';
import { getLoggerToken } from 'nestjs-pino';
import { CryptoService } from '../common/security/crypto.service';
import { Web3Service } from '../common/web3/web3.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { TimeService } from '../common/time/time.service';
import * as moment from 'moment';

const USER_REQUEST_DATA_USER_ID = '456';
const USER_REQUEST_DATA_USERNAME = 'boop';
const USER_REQUEST_DATA_WALLET_ADDRESS = '0x123';
const USER_REQUEST_DATA_USER_ID_MISSING_WALLET = 'bro';
const CRYPTO_256_BIT_SECRET = '0x123456789012345678901234567890123456789012345678901234567890123';
const MOMENT_UTC_NOW = moment('2020-01-01T00:00:00.000Z');

describe(UsersService.name, () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(val => {
                if (val && val.data && val.data.walletAddress === '0x8ba1f109551bD432803012645Ac136ddd64DBA72') {
                  return {
                    ...val.data,
                  };
                } else if (val && val.data && val.data.walletAddress === '0x0Ac1dF02185025F65202660F8167210A80dD5086') {
                  return null;
                }

                return null;
              }),
              findUnique: jest.fn(val => {
                if (val && val.where) {
                  if (val.where.id === '123') {
                    return { id: '123' };
                  } else if (val.where.username === 'fujiwara_takumi') {
                    return { username: 'fujiwara_takumi' };
                  } else if (val.where.id === USER_REQUEST_DATA_USER_ID) {
                    return {
                      id: USER_REQUEST_DATA_USER_ID,
                      username: USER_REQUEST_DATA_USERNAME,
                      roles: [
                        {
                          role: {
                            role: RoleType.User,
                          },
                        },
                      ],
                      walletAddress: USER_REQUEST_DATA_WALLET_ADDRESS,
                    };
                  } else if (val.where.id === USER_REQUEST_DATA_USER_ID_MISSING_WALLET) {
                    return {
                      id: USER_REQUEST_DATA_USER_ID_MISSING_WALLET,
                      username: USER_REQUEST_DATA_USERNAME,
                      roles: [
                        {
                          role: {
                            role: RoleType.User,
                          },
                        },
                      ],
                    };
                  } else if (
                    val &&
                    val.where &&
                    val.where.walletAddress &&
                    val.where.walletAddress === '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
                  ) {
                    return {
                      walletAddress: val.where.walletAddress,
                      walletSigningNonce: 'nonce',
                    };
                  }
                }

                return null;
              }),
              update: jest.fn(val => {
                if (val && val.data) {
                  return val.data;
                }
              }),
            },
          },
        },
        Web3Service,
        {
          provide: CryptoService,
          useValue: {
            generate256BitSecret: jest.fn(() => CRYPTO_256_BIT_SECRET),
          },
        },
        {
          provide: TimeService,
          useValue: {
            getUtcNow: jest.fn(() => MOMENT_UTC_NOW),
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
    const user = await service.createWeb3Login(address);

    // assert
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user.walletAddress).toBe(address);
    expect(user.walletSigningNonce).toBe(CRYPTO_256_BIT_SECRET);
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
    const user = await service.getUserByWalletAddress(address);

    // assert
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user?.walletAddress).toBe(address);
    expect(user?.walletSigningNonce).toBe('nonce');
  });

  it('should fail to find wallet login', async () => {
    // arrange
    const address = '0x0Ac1dF02185025F65202660F8167210A80dD5086';

    // act
    const userWalletLogin = await service.getUserByWalletAddress(address);

    // assert
    expect(userWalletLogin).toBeNull();
  });

  it('should fail to find wallet login by public address because address is invalid', async () => {
    // arrange
    const address = 'I like turtles!';

    // act
    await expect(service.getUserByWalletAddress(address)).rejects.toThrow(BadRequestException);
  });

  it('should get user request data', async () => {
    // arrange
    const userId = USER_REQUEST_DATA_USER_ID;

    // act
    const user = await service.getUserRequestDataById(userId);

    // assert
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user?.id).toBe(userId);
    expect(user?.username).toBe(USER_REQUEST_DATA_USERNAME);
    expect(user?.roles).toBeDefined();
    expect(user?.roles).not.toBeNull();
    expect(user?.roles).toContain(RoleType.User);
    expect(user?.walletAddress).toBe(USER_REQUEST_DATA_WALLET_ADDRESS);
  });

  it('should not get user request data - user not found', async () => {
    // arrange
    const userId = 'bruh';

    // actsert
    await expect(service.getUserRequestDataById(userId)).rejects.toThrowError(NotFoundException);
  });

  it('should update on successful login', async () => {
    // arrange
    const userId = USER_REQUEST_DATA_USER_ID;

    // act
    const walletLogin = await service.updateLoginSuccess(userId);

    // assert
    expect(walletLogin).toBeDefined();
    expect(walletLogin).not.toBeNull();
    expect(walletLogin.lastLoggedInAt).toEqual(MOMENT_UTC_NOW.toDate());
    expect(walletLogin.loginAttempts).toBe(0);
    expect(walletLogin.lockoutExpiryAt).toBeNull();
    expect(walletLogin.walletSigningNonce).toBe(CRYPTO_256_BIT_SECRET);
  });

  it('should update on failed login', async () => {
    // arrange
    const userId = USER_REQUEST_DATA_USER_ID;
    const loginAttempts = 3;
    const lockoutExpiryAt = MOMENT_UTC_NOW.add(1, 'hour').toDate();

    // act
    const walletLogin = await service.updateLoginFailed(userId, loginAttempts, lockoutExpiryAt);

    // assert
    expect(walletLogin).toBeDefined();
    expect(walletLogin).not.toBeNull();
    expect(walletLogin.loginAttempts).toBe(loginAttempts);
    expect(walletLogin.lockoutExpiryAt).toBe(lockoutExpiryAt);
    expect(walletLogin.walletSigningNonce).toBe(CRYPTO_256_BIT_SECRET);
  });
});
