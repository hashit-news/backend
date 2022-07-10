import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import authConfig from '../common/config/auth.config';
import { UserIdUsernameDto } from './auth.models';
import { PrismaService } from '../common/database/prisma.service';
import { TimeService } from '../common/time/time.service';
import * as fs from 'fs';
import { TokenType } from '@prisma/client';
import * as moment from 'moment';

const EXISTING_USER_ID = '1';
const EXISTING_REFRESH_TOKEN = 'existing-refresh-token';

describe('TokenService', () => {
  let service: TokenService;
  let config: ConfigType<typeof authConfig>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [authConfig] })],
      providers: [
        TokenService,
        JwtService,
        {
          provide: PrismaService,
          useValue: null,
        },
        TimeService,
        {
          provide: PrismaService,
          useValue: {
            userToken: {
              findUnique: jest.fn(val => {
                if (val && val.where && val.where.userId_tokenType) {
                  if (val.where.userId_tokenType.userId === EXISTING_USER_ID) {
                    return {
                      userId: EXISTING_USER_ID,
                      tokenType: TokenType.RefreshToken,
                      token: EXISTING_REFRESH_TOKEN,
                    };
                  }
                }

                return null;
              }),
              delete: jest.fn(val => {
                if (val && val.where && val.where.userId_tokenType) {
                  if (val.where.userId_tokenType.userId === EXISTING_USER_ID) {
                    return {
                      userId: EXISTING_USER_ID,
                      tokenType: TokenType.RefreshToken,
                    };
                  }
                }

                return null;
              }),
              update: jest.fn(val => {
                return val?.data;
              }),
              create: jest.fn(val => {
                return val?.data;
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    config = module.get<ConfigType<typeof authConfig>>(authConfig.KEY);
  });

  it('should get jwt sign options', async () => {
    // arrange
    const issuer = 'Mr. Issuer';
    const privateKeyFile = './private.key';
    const expiresIn = 300;
    const encoding = 'utf8';
    const algorithm = 'RS256';
    const privateKey = await fs.promises.readFile(privateKeyFile, encoding);

    // act
    const options = await service.getJwtSignOptions(issuer, privateKeyFile, expiresIn);

    // assert
    expect(options).toBeDefined();
    expect(options).not.toBeNull();
    expect(options.issuer).toBe(issuer);
    expect(options.algorithm).toBe(algorithm);
    expect(options.encoding).toBe(encoding);
    expect(options.privateKey).toBe(privateKey);
    expect(options.expiresIn).toBe(expiresIn);
  });

  it('should get jwt sign options wihtout expiry', async () => {
    // arrange
    const issuer = 'Mr. Issuer';
    const privateKeyFile = './private.key';
    const encoding = 'utf8';
    const algorithm = 'RS256';
    const privateKey = await fs.promises.readFile(privateKeyFile, encoding);

    // act
    const options = await service.getJwtSignOptions(issuer, privateKeyFile);

    // assert
    expect(options).toBeDefined();
    expect(options).not.toBeNull();
    expect(options.issuer).toBe(issuer);
    expect(options.algorithm).toBe(algorithm);
    expect(options.encoding).toBe(encoding);
    expect(options.privateKey).toBe(privateKey);
    expect(options.expiresIn).toBeUndefined();
  });

  it('should get jwt verify options', async () => {
    // arrange
    const { issuer, publicKeyFile } = config;
    const encoding = 'utf8';
    const algorithm = 'RS256';
    const publicKey = await fs.promises.readFile(publicKeyFile, encoding);

    // act
    const options = await service.getJwtVerifyOptions();

    // assert
    expect(options).toBeDefined();
    expect(options).not.toBeNull();
    expect(options.issuer).toBe(issuer);
    expect(options.algorithms).toBeDefined();
    expect(options.algorithms).not.toBeNull();
    expect(options.algorithms).toEqual([algorithm]);
    expect(options.publicKey).toBe(publicKey);
  });

  it('should get access token sign options', async () => {
    // arrange
    const { issuer, expiresIn, privateKeyFile } = config;
    const encoding = 'utf8';
    const algorithm = 'RS256';
    const privateKey = await fs.promises.readFile(privateKeyFile, encoding);

    // act
    const options = await service.getAccessTokenSignOptions();

    // assert
    expect(options).toBeDefined();
    expect(options).not.toBeNull();
    expect(options.issuer).toBe(issuer);
    expect(options.algorithm).toBe(algorithm);
    expect(options.encoding).toBe(encoding);
    expect(options.privateKey).toBe(privateKey);
    expect(options.expiresIn).toBe(expiresIn);
  });

  it('should get refresh token sign options', async () => {
    // arrange
    const { issuer, privateKeyFile } = config;
    const encoding = 'utf8';
    const algorithm = 'RS256';
    const privateKey = await fs.promises.readFile(privateKeyFile, encoding);

    // act
    const options = await service.getRefreshTokenSignOptions();

    // assert
    expect(options).toBeDefined();
    expect(options).not.toBeNull();
    expect(options.issuer).toBe(issuer);
    expect(options.algorithm).toBe(algorithm);
    expect(options.encoding).toBe(encoding);
    expect(options.privateKey).toBe(privateKey);
    expect(options.expiresIn).toBeUndefined();
  });

  it('should generate valid JWT', async () => {
    // arrange
    const { issuer, expiresIn, privateKeyFile } = config;
    const signOptions = await service.getJwtSignOptions(issuer, privateKeyFile, expiresIn);
    const verifyOptions = await service.getJwtVerifyOptions();
    const user: UserIdUsernameDto = {
      id: '1',
      username: 'fujiwara_takumi',
    };

    // act
    const token = await service.generateJwtToken(user, signOptions);
    const payload = await service.verifyJwtToken(token, verifyOptions);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(payload).toBeDefined();
    expect(payload).not.toBeNull();
    expect(payload.sub).toEqual(user.id);
    expect(payload.name).toEqual(user.username);
  });

  it('should generate valid JWT without username', async () => {
    // arrange
    const { issuer, expiresIn, privateKeyFile } = config;
    const signOptions = await service.getJwtSignOptions(issuer, privateKeyFile, expiresIn);
    const verifyOptions = await service.getJwtVerifyOptions();
    const user: UserIdUsernameDto = {
      id: '1',
    };

    // act
    const token = await service.generateJwtToken(user, signOptions);
    const payload = await service.verifyJwtToken(token, verifyOptions);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(payload).toBeDefined();
    expect(payload).not.toBeNull();
    expect(payload.sub).toEqual(user.id);
    expect(payload.name).toBeUndefined();
  });

  it('should generate valid access token', async () => {
    // arrange
    const user: UserIdUsernameDto = {
      id: '1',
      username: 'fujiwara_takumi',
    };

    // act
    const token = await service.generateAccessToken(user);
    const payload = await service.verifyAccessToken(token);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(payload).toBeDefined();
    expect(payload).not.toBeNull();
    expect(payload.sub).toEqual(user.id);
    expect(payload.name).toEqual(user.username);
  });

  it('should generate valid refresh token', async () => {
    // arrange
    const user: UserIdUsernameDto = {
      id: '1',
      username: 'fujiwara_takumi',
    };

    // act
    const token = await service.generateRefreshToken(user);
    const payload = await service.verifyRefreshToken(token);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(payload).toBeDefined();
    expect(payload).not.toBeNull();
    expect(payload.sub).toEqual(user.id);
    expect(payload.name).toEqual(user.username);
  });

  it('should get refresh token by user id', async () => {
    // arrange
    const userId = EXISTING_USER_ID;

    // act
    const token = await service.getRefreshTokenByUserId(userId);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(token?.userId).toEqual(userId);
    expect(token?.tokenType).toBe(TokenType.RefreshToken);
  });

  it('should upsert refresh token - update existing', async () => {
    // arrange
    const userId = EXISTING_USER_ID;
    const refreshToken = EXISTING_REFRESH_TOKEN;

    // act
    const token = await service.upsertUserRefreshToken(userId, refreshToken);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(token?.token).toBe(refreshToken);
  });

  it('should upsert refresh token - create new', async () => {
    // arrange
    const userId = 'NEW_USER_ID';
    const refreshToken = 'NEW TOKEN';
    const expiresAt = moment.utc().add(config.refreshTokenExpiresIn, 'seconds');

    // act
    const token = await service.upsertUserRefreshToken(userId, refreshToken);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(token?.userId).toBe(userId);
    expect(token?.tokenType).toBe(TokenType.RefreshToken);
    expect(token?.token).toBe(refreshToken);
    expect(moment(token?.expiresAt).unix()).toBeCloseTo(expiresAt.unix());
  });

  it('should revoke refresh token', async () => {
    // arrange
    const userId = EXISTING_USER_ID;

    // act
    const token = await service.revokeRefreshToken(userId);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(token?.userId).toEqual(userId);
    expect(token?.tokenType).toBe(TokenType.RefreshToken);
  });
});
