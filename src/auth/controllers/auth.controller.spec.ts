import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AccessTokenResponse } from '../dtos/auth.models';
import { AuthService } from '../services/auth.service';

describe(AuthController.name, () => {
  let controller: AuthController;
  let authService: AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
      ],
      controllers: [AuthController],
    }).compile();
    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  it('should get web3 login info', async () => {
    // arrange
    const userId = 'userId';
    const walletAddress = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
    const signature = 'secret';
    authService.getWeb3LoginInfo = jest.fn(async () => {
      return {
        userId,
        walletAddress,
        signature,
      };
    });

    // act
    const result = await controller.getLoginInfo(walletAddress);

    // assert

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.userId).toBe(userId);
    expect(result.walletAddress).toBe(walletAddress);
    expect(result.signature).toBe(signature);
  });

  it('should fail to get web3 login and re-throw unauthorized exception', async () => {
    // arrange
    const walletAddress = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
    authService.getWeb3LoginInfo = jest.fn(async () => {
      throw new UnauthorizedException();
    });

    // actsert
    await expect(controller.getLoginInfo(walletAddress)).rejects.toThrowError(UnauthorizedException);
  });

  it('should fail to get web3 login and throw any exception as unauthorized exception', async () => {
    // arrange
    const walletAddress = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
    authService.getWeb3LoginInfo = jest.fn(async () => {
      throw new Error();
    });

    // actsert
    await expect(controller.getLoginInfo(walletAddress)).rejects.toThrowError(UnauthorizedException);
  });

  it('should get access token', async () => {
    // arrange
    const walletAddress = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
    const signedMessage = 'secret';
    const accessToken = 'accessToken';
    const refreshToken = 'refreshToken';
    authService.generateWeb3AccessToken = jest.fn(async () => {
      const data: AccessTokenResponse = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 300,
        refresh_token: refreshToken,
      };

      return data;
    });

    // act
    const result = await controller.getToken({ walletAddress: walletAddress, signedMessage });

    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.access_token).toBe(accessToken);
    expect(result.token_type).toBe('Bearer');
    expect(result.expires_in).toBe(300);
    expect(result.refresh_token).toBe(refreshToken);
  });

  it('should get refresh token', async () => {
    // arrange
    const accessToken = 'accessToken';
    const refreshToken = 'refreshToken';
    authService.generateRefreshedAccessToken = jest.fn(async () => {
      const data: AccessTokenResponse = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 300,
        refresh_token: refreshToken,
      };

      return data;
    });

    // act
    const result = await controller.getRefreshToken({ refreshToken });

    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.access_token).toBe(accessToken);
    expect(result.token_type).toBe('Bearer');
    expect(result.expires_in).toBe(300);
    expect(result.refresh_token).toBe(refreshToken);
  });
});
