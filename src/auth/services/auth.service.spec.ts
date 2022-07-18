import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/database/prisma.service';
import { UsersService } from '../../users/users.service';
import { Web3Service } from '../../common/web3/web3.service';
import { ethers } from 'ethers';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RoleType, TokenType } from '@prisma/client';
import { TokenService } from '../services/token.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import authConfig from '../../common/config/auth.config';
import { TimeService } from '../../common/time/time.service';
import { UserWalletLoginDto } from '../../users/user.models';
import * as moment from 'moment';
import { AccessTokenResponse, UserIdUsernameDto } from '../dtos/auth.models';

const EXISTING_WALLET_ADDRESS = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
const EXISTING_SIGNED_MESSAGE = 'This is valid';
const EXISTING_NONCE = 'nonce';
const NEW_NONCE = 'nonce1';
const EXISTING_USER_ID = '123';
const EXISTING_USER_NAME = 'fujiwara_takumi_86';
const EXISTING_FAKE_ADDRESS = 'fake';
const EXISTING_USER_EMAIL = 'fake@email.com';

describe(AuthService.name, () => {
  let service: AuthService;
  let newWallet: ethers.Wallet;
  let userService: UsersService;
  let timeService: TimeService;
  let tokenService: TokenService;
  let config: ConfigType<typeof authConfig>;

  beforeEach(async () => {
    newWallet = ethers.Wallet.createRandom();
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [authConfig] })],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            getUserByWalletAddress: jest.fn(val => {
              if (val === EXISTING_WALLET_ADDRESS) {
                return {
                  id: EXISTING_USER_ID,
                  walletAddress: EXISTING_WALLET_ADDRESS,
                  walletSigningNonce: EXISTING_NONCE,
                  username: EXISTING_USER_NAME,
                };
              } else if (val === EXISTING_FAKE_ADDRESS) {
                return {
                  id: 'NOT EXISTS',
                  walletAddress: EXISTING_WALLET_ADDRESS,
                  walletSigningNonce: EXISTING_NONCE,
                };
              }

              return null;
            }),
            createWeb3Login: jest.fn(val => {
              return {
                walletAddress: val,
                userId: EXISTING_USER_ID,
                walletSigningNonce: NEW_NONCE,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }),
            getUserById: jest.fn(val => {
              if (val === EXISTING_USER_ID) {
                return {
                  id: EXISTING_USER_ID,
                  username: EXISTING_USER_NAME,
                  roles: [{ role: { role: RoleType.User } }],
                };
              }

              return null;
            }),
            updateLoginSuccess: jest.fn(),
            updateLoginFailed: jest.fn(),
          },
        },
        JwtService,
        {
          provide: Web3Service,
          useValue: {
            validateSignature: jest.fn((walletAddress, signature, signedMessage) => {
              if (
                walletAddress === EXISTING_WALLET_ADDRESS &&
                signature === EXISTING_NONCE &&
                signedMessage == EXISTING_SIGNED_MESSAGE
              ) {
                return true;
              }

              return false;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
        TokenService,
        {
          provide: TimeService,
          useValue: {
            getUtcNow: jest.fn(() => moment('2020-01-01T00:00:00.000Z')),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UsersService>(UsersService);
    timeService = module.get<TimeService>(TimeService);
    tokenService = module.get<TokenService>(TokenService);
    config = module.get<ConfigType<typeof authConfig>>(authConfig.KEY);
  });

  it('should get existing web3 login info', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;

    // act
    const loginInfo = await service.getWeb3LoginInfo(walletAddress);

    // assert
    expect(loginInfo.walletAddress).toBe(walletAddress);
    expect(loginInfo.signature).toBe(EXISTING_NONCE);
  });

  it('should get create new wallet login and get web3 login info', async () => {
    // arrange
    const walletAddress = newWallet.address;

    // act
    const loginInfo = await service.getWeb3LoginInfo(walletAddress);

    // assert
    expect(loginInfo.walletAddress).toBe(walletAddress);
    expect(loginInfo.signature).toBe(NEW_NONCE);
  });

  it('should failed to get web3 login info - account is locked', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;
    const wallet: UserWalletLoginDto = {
      id: EXISTING_USER_ID,
      walletAddress: EXISTING_WALLET_ADDRESS,
      walletSigningNonce: EXISTING_NONCE,
      username: EXISTING_USER_NAME,
      lockoutExpiryAt: timeService.getUtcNow().add(1, 'second').toDate(),
      loginAttempts: 3,
    };

    jest.spyOn(userService, 'getUserByWalletAddress').mockImplementation(async () => wallet);

    // actsert
    await expect(service.getWeb3LoginInfo(walletAddress)).rejects.toThrowError(UnauthorizedException);
  });

  it('should validate web3 signature', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;
    const signedMessage = EXISTING_SIGNED_MESSAGE;

    // act
    const user = await service.validateWeb3Signature(walletAddress, signedMessage);

    // assert
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user?.id).toBe(EXISTING_USER_ID);
    expect(user?.username).toBe(EXISTING_USER_NAME);
    expect(userService.updateLoginSuccess).toBeCalledTimes(1);
  });

  it('should not validate web3 signature', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;
    const signedMessage = 'invalid';

    // act
    const user = await service.validateWeb3Signature(walletAddress, signedMessage);

    // assert
    expect(user).toBeNull();
    expect(userService.updateLoginFailed).toBeCalledTimes(1);
  });

  it('should not validate web3 signature and lock account', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;
    const signedMessage = 'invalid';
    const wallet: UserWalletLoginDto = {
      id: EXISTING_USER_ID,
      walletAddress: EXISTING_WALLET_ADDRESS,
      walletSigningNonce: EXISTING_NONCE,
      username: EXISTING_USER_NAME,
      lockoutExpiryAt: null,
      loginAttempts: config.maxLoginAttempts - 1, // set current login attempts 1 less than max
    };

    let actualLockoutExpiryAt: Date | null = null;
    let actualLoginAttempts: number | null = null;
    jest.spyOn(userService, 'getUserByWalletAddress').mockImplementation(async () => wallet);
    userService.updateLoginFailed = jest.fn(async (id, loginAttempts, lockoutExpiryAt: Date | null) => {
      actualLockoutExpiryAt = lockoutExpiryAt;
      actualLoginAttempts = loginAttempts;
      return {
        id,
        walletAddress: EXISTING_WALLET_ADDRESS,
        walletSigningNonce: EXISTING_NONCE,
        username: EXISTING_USER_NAME,
        email: EXISTING_USER_EMAIL,
        emailVerified: false,
        lockoutExpiryAt,
        loginAttempts,
        lastLoggedInAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // act
    const user = await service.validateWeb3Signature(walletAddress, signedMessage);

    // assert
    expect(user).toBeNull();
    expect(userService.updateLoginFailed).toBeCalledTimes(1);
    expect(actualLoginAttempts).toBe(config.maxLoginAttempts);
    expect(actualLockoutExpiryAt).toBeDefined();
    expect(moment(actualLockoutExpiryAt).unix()).toBeCloseTo(
      timeService.getUtcNow().add(config.lockoutDurationSecs, 'seconds').unix()
    );
  });

  it('should not validate web3 signature and increase login attempt', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;
    const signedMessage = 'invalid';
    const wallet: UserWalletLoginDto = {
      id: EXISTING_USER_ID,
      walletAddress: EXISTING_WALLET_ADDRESS,
      walletSigningNonce: EXISTING_NONCE,
      username: EXISTING_USER_NAME,
      lockoutExpiryAt: timeService.getUtcNow().add(-1, 'second').toDate(),
      loginAttempts: config.maxLoginAttempts, // set current login attempts 1 less than max
    };

    let actualLockoutExpiryAt: Date | null = null;
    let actualLoginAttempts: number | null = null;
    jest.spyOn(userService, 'getUserByWalletAddress').mockImplementation(async () => wallet);
    userService.updateLoginFailed = jest.fn(async (id, loginAttempts, lockoutExpiryAt: Date | null) => {
      actualLockoutExpiryAt = lockoutExpiryAt;
      actualLoginAttempts = loginAttempts;
      return {
        id,
        walletAddress: EXISTING_WALLET_ADDRESS,
        walletSigningNonce: EXISTING_NONCE,
        username: EXISTING_USER_NAME,
        email: EXISTING_USER_EMAIL,
        emailVerified: false,
        lockoutExpiryAt,
        loginAttempts,
        lastLoggedInAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // act
    const user = await service.validateWeb3Signature(walletAddress, signedMessage);

    // assert
    expect(user).toBeNull();
    expect(userService.updateLoginFailed).toBeCalledTimes(1);
    expect(actualLockoutExpiryAt).toBeDefined();
    expect(actualLockoutExpiryAt).toBeNull();
    expect(actualLoginAttempts).toBe(1);
  });

  it('should not validate web3 signature - invalid wallet address', async () => {
    // arrange
    const walletAddress = 'invalid';
    const signedMessage = EXISTING_SIGNED_MESSAGE;

    // actsert
    await expect(service.validateWeb3Signature(walletAddress, signedMessage)).rejects.toThrowError(NotFoundException);
  });

  it('should not validate web3 signature - account is locked', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;
    const signedMessage = EXISTING_SIGNED_MESSAGE;
    const wallet: UserWalletLoginDto = {
      id: EXISTING_USER_ID,
      walletAddress: EXISTING_WALLET_ADDRESS,
      walletSigningNonce: EXISTING_NONCE,
      username: EXISTING_USER_NAME,
      lockoutExpiryAt: timeService.getUtcNow().add(1, 'second').toDate(),
      loginAttempts: 3,
    };

    jest.spyOn(userService, 'getUserByWalletAddress').mockImplementation(async () => wallet);

    // actsert
    await expect(service.validateWeb3Signature(walletAddress, signedMessage)).rejects.toThrowError(
      UnauthorizedException
    );
  });

  it('should generate access token', async () => {
    // arrange
    const user: UserIdUsernameDto = {
      id: EXISTING_USER_ID,
      username: EXISTING_USER_NAME,
    };

    tokenService.upsertUserRefreshToken = jest.fn();

    // act
    const res = await service.generateAccessToken(user);

    // assert
    const payload = await verifyAccessTokenResponse(res);
    expect(payload.sub).toBe(user.id);
    expect(payload.name).toBe(user.username);
    expect(tokenService.upsertUserRefreshToken).toBeCalledTimes(1);
  });

  it('should generate web3 access token', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;
    const signedMessage = EXISTING_SIGNED_MESSAGE;
    const user: UserIdUsernameDto = {
      id: EXISTING_USER_ID,
      username: EXISTING_USER_NAME,
    };

    jest.spyOn(service, 'validateWeb3Signature').mockImplementation(async () => user);
    tokenService.upsertUserRefreshToken = jest.fn();

    // act
    const res = await service.generateWeb3AccessToken(walletAddress, signedMessage);

    // assert
    const payload = await verifyAccessTokenResponse(res);
    expect(payload.sub).toBe(user.id);
    expect(payload.name).toBe(user.username);
    expect(tokenService.upsertUserRefreshToken).toBeCalledTimes(1);
  });

  it('should not generate web3 access token - user not verified', async () => {
    // arrange
    const walletAddress = EXISTING_WALLET_ADDRESS;
    const signedMessage = 'invalid';

    // actsert
    await expect(service.generateWeb3AccessToken(walletAddress, signedMessage)).rejects.toThrowError(
      UnauthorizedException
    );
  });

  it('should generate access token from refresh token', async () => {
    const user: UserIdUsernameDto = {
      id: EXISTING_USER_ID,
      username: EXISTING_USER_NAME,
    };
    const refreshToken = 'abc';
    const existingRefreshToken = {
      userId: EXISTING_USER_ID,
      token: refreshToken,
      tokenType: TokenType.RefreshToken,
      expiresAt: timeService.getUtcNow().add(1, 'second').toDate(),
      createdAt: timeService.getUtcNow().toDate(),
      updatedAt: timeService.getUtcNow().toDate(),
    };

    tokenService.upsertUserRefreshToken = jest.fn();
    jest.spyOn(tokenService, 'getRefreshTokenByUserId').mockImplementation(async () => existingRefreshToken);
    jest.spyOn(service, 'validateRefreshToken').mockImplementation(async () => user);

    // act
    const res = await service.generateRefreshedAccessToken(refreshToken);

    // assert
    const payload = await verifyAccessTokenResponse(res);
    expect(payload.sub).toBe(user.id);
    expect(payload.name).toBe(user.username);
    expect(tokenService.upsertUserRefreshToken).toBeCalledTimes(1);
  });

  it('should not generate access token from refresh token - refresh token expired', async () => {
    const user: UserIdUsernameDto = {
      id: EXISTING_USER_ID,
      username: EXISTING_USER_NAME,
    };
    const refreshToken = 'abc';
    const existingRefreshToken = {
      userId: EXISTING_USER_ID,
      token: refreshToken,
      tokenType: TokenType.RefreshToken,
      expiresAt: timeService.getUtcNow().add(-1, 'second').toDate(),
      createdAt: timeService.getUtcNow().toDate(),
      updatedAt: timeService.getUtcNow().toDate(),
    };

    tokenService.revokeRefreshToken = jest.fn();
    jest.spyOn(tokenService, 'getRefreshTokenByUserId').mockImplementation(async () => existingRefreshToken);
    jest.spyOn(service, 'validateRefreshToken').mockImplementation(async () => user);

    // actsert
    await expect(service.generateRefreshedAccessToken(refreshToken)).rejects.toThrowError(UnauthorizedException);
    expect(tokenService.revokeRefreshToken).toBeCalledTimes(1);
  });

  it('should not generate access token from refresh token - refresh token not matching', async () => {
    const user: UserIdUsernameDto = {
      id: EXISTING_USER_ID,
      username: EXISTING_USER_NAME,
    };
    const refreshToken = 'abc';
    const existingRefreshToken = {
      userId: EXISTING_USER_ID,
      token: 'SOME_OTHER_TOKEN',
      tokenType: TokenType.RefreshToken,
      expiresAt: timeService.getUtcNow().add(1, 'second').toDate(),
      createdAt: timeService.getUtcNow().toDate(),
      updatedAt: timeService.getUtcNow().toDate(),
    };

    tokenService.revokeRefreshToken = jest.fn();
    jest.spyOn(tokenService, 'getRefreshTokenByUserId').mockImplementation(async () => existingRefreshToken);
    jest.spyOn(service, 'validateRefreshToken').mockImplementation(async () => user);

    // actsert
    await expect(service.generateRefreshedAccessToken(refreshToken)).rejects.toThrowError(UnauthorizedException);
    expect(tokenService.revokeRefreshToken).toBeCalledTimes(1);
  });

  it('should not generate access token from refresh token - refresh token does not exist', async () => {
    const user: UserIdUsernameDto = {
      id: EXISTING_USER_ID,
      username: EXISTING_USER_NAME,
    };
    const refreshToken = 'abc';

    jest.spyOn(tokenService, 'getRefreshTokenByUserId').mockImplementation(async () => null);
    jest.spyOn(service, 'validateRefreshToken').mockImplementation(async () => user);

    // actsert
    await expect(service.generateRefreshedAccessToken(refreshToken)).rejects.toThrowError(UnauthorizedException);
  });

  it('should not generate access token from refresh token - invalid refresh token', async () => {
    const refreshToken = 'abc';

    jest.spyOn(service, 'validateRefreshToken').mockImplementation(async () => null);

    // actsert
    await expect(service.generateRefreshedAccessToken(refreshToken)).rejects.toThrowError(UnauthorizedException);
  });

  const verifyAccessTokenResponse = async (res: AccessTokenResponse) => {
    const accessTokenVerified = await tokenService.verifyAccessToken(res.access_token);
    const refreshTokenVerified = await tokenService.verifyRefreshToken(res.refresh_token || '');

    expect(res).toBeDefined();
    expect(res).not.toBeNull();
    expect(res.access_token).not.toBeNull();
    expect(res.refresh_token).toBeDefined();
    expect(res.refresh_token).not.toBeNull();
    expect(res.expires_in).toBe(config.expiresIn);
    expect(res.token_type).toBe('Bearer');
    expect(accessTokenVerified).toBeDefined();
    expect(accessTokenVerified).not.toBeNull();
    expect(accessTokenVerified?.sub).toBe(EXISTING_USER_ID);
    expect(accessTokenVerified?.name).toBe(EXISTING_USER_NAME);
    expect(refreshTokenVerified).toBeDefined();
    expect(refreshTokenVerified).not.toBeNull();
    expect(refreshTokenVerified?.sub).toBe(EXISTING_USER_ID);
    expect(refreshTokenVerified?.name).toBe(EXISTING_USER_NAME);

    return accessTokenVerified;
  };

  it('should validate refresh token', async () => {
    // arrange
    const user: UserIdUsernameDto = {
      id: EXISTING_USER_ID,
      username: EXISTING_USER_NAME,
    };

    const refreshToken = await tokenService.generateRefreshToken(user);

    // act
    const res = await service.validateRefreshToken(refreshToken);

    // aseert
    expect(res).toBeDefined();
    expect(res).not.toBeNull();
    expect(res?.id).toBe(user.id);
    expect(res?.username).toBe(user.username);
  });

  it('should not validate refresh token', async () => {
    // arrange
    tokenService.verifyRefreshToken = jest.fn().mockImplementation(() => null);
    const refreshToken = 'invalid';

    // act
    const res = await service.validateRefreshToken(refreshToken);

    // aseert
    expect(res).toBeDefined();
    expect(res).toBeNull();
  });
});
