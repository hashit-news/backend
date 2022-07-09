import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/database/prisma.service';
import { UsersService } from '../users/users.service';
import { Web3Service } from '../common/web3/web3.service';
import { getLoggerToken } from 'nestjs-pino';
import { ethers } from 'ethers';
import { NotFoundException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { TokenService } from './token.service';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../common/config/auth.config';

const EXISTING_PUBLIC_ADDRESS = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
const EXISTING_SIGNED_MESSAGE = 'This is valid';
const EXISTING_NONCE = 'nonce';
const NEW_NONCE = 'nonce1';
const EXISTING_USER_ID = '123';
const EXISTING_USER_NAME = 'fujiwara_takumi_86';
const EXISTING_FAKE_ADDRESS = 'fake';

describe('AuthService', () => {
  let service: AuthService;
  let newWallet: ethers.Wallet;
  beforeEach(async () => {
    newWallet = ethers.Wallet.createRandom();
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [authConfig] })],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            getWalletLoginByPublicAddress: jest.fn(val => {
              if (val === EXISTING_PUBLIC_ADDRESS) {
                return {
                  userId: EXISTING_USER_ID,
                  publicAddress: EXISTING_PUBLIC_ADDRESS,
                  nonce: EXISTING_NONCE,
                  username: EXISTING_USER_NAME,
                };
              } else if (val === EXISTING_FAKE_ADDRESS) {
                return {
                  userId: 'NOT EXISTS',
                  publicAddress: EXISTING_PUBLIC_ADDRESS,
                  nonce: EXISTING_NONCE,
                };
              }

              return null;
            }),
            createWeb3Login: jest.fn(val => {
              return {
                publicAddress: val,
                userId: EXISTING_USER_ID,
                nonce: NEW_NONCE,
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
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: Web3Service,
          useValue: {
            validateSignature: jest.fn((publicAddress, signature, signedMessage) => {
              if (
                publicAddress === EXISTING_PUBLIC_ADDRESS &&
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
          provide: getLoggerToken(AuthService.name),
          useValue: null,
        },
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
        {
          provide: TokenService,
          useValue: null,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should get existing web3 login info', async () => {
    // arrange
    const publicAddress = EXISTING_PUBLIC_ADDRESS;

    // act
    const loginInfo = await service.getWeb3LoginInfo(publicAddress);

    // assert
    expect(loginInfo.publicAddress).toBe(publicAddress);
    expect(loginInfo.signature).toBe(EXISTING_NONCE);
  });

  it('should get create new wallet login and get web3 login info', async () => {
    // arrange
    const publicAddress = newWallet.address;

    // act
    const loginInfo = await service.getWeb3LoginInfo(publicAddress);

    // assert
    expect(loginInfo.publicAddress).toBe(publicAddress);
    expect(loginInfo.signature).toBe(NEW_NONCE);
  });

  it('should validate web3 signature', async () => {
    // arrange
    const publicAddress = EXISTING_PUBLIC_ADDRESS;
    const signedMessage = EXISTING_SIGNED_MESSAGE;

    // act
    const user = await service.validateWeb3Signature(publicAddress, signedMessage);

    // assert
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user?.id).toBe(EXISTING_USER_ID);
    expect(user?.username).toBe(EXISTING_USER_NAME);
  });

  it('should not validate web3 signature', async () => {
    // arrange
    const publicAddress = EXISTING_PUBLIC_ADDRESS;
    const signedMessage = 'invalid';

    // act
    const user = await service.validateWeb3Signature(publicAddress, signedMessage);

    // assert
    expect(user).toBeNull();
  });

  it('should not validate web3 signature - invalid wallet address', async () => {
    // arrange
    const publicAddress = 'invalid';
    const signedMessage = EXISTING_SIGNED_MESSAGE;

    // actsert
    await expect(service.validateWeb3Signature(publicAddress, signedMessage)).rejects.toThrowError(NotFoundException);
  });
});
