import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res, UnauthorizedException } from '@nestjs/common';
import { ethers } from 'ethers';
import { Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AccessTokenException } from './auth.exceptions';
import {
  AccessTokenErrorCode,
  AccessTokenRequestDto,
  AccessTokenResponseDto,
  GrantType,
  UserIdUsernameDto,
  Web3LoginRequestDto,
} from './auth.models';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    @InjectPinoLogger() private readonly logger?: PinoLogger
  ) {}

  @Get('web3')
  async getLoginInfo(@Query('publicAddress') publicAddress: string) {
    try {
      return await this.authService.getWeb3LoginInfo(publicAddress);
    } catch (err) {
      this.logger?.error(err, 'Error getting login info');

      if (err instanceof UnauthorizedException) {
        throw err;
      }

      throw new UnauthorizedException(err);
    }
  }

  @Get('login/test')
  async createAndSignWeb3LoginInfo() {
    const wallet = ethers.Wallet.createRandom();
    const loginInfo = await this.authService.getWeb3LoginInfo(wallet.address);
    const signedMessage = await wallet.signMessage(loginInfo.signature);

    return { publicAddress: wallet.address, signedMessage };
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getToken(@Body() body: AccessTokenRequestDto, @Res() response: Response) {
    try {
      if (body.grant_type === GrantType.Web3) {
        if (!body.public_address || !body.signed_message) {
          throw new AccessTokenException(AccessTokenErrorCode.InvalidRequest);
        }

        const user = await this.validateWeb3(body.public_address, body.signed_message);

        if (!user) {
          throw new AccessTokenException(AccessTokenErrorCode.InvalidGrant);
        }

        return response.json(await this.authService.generateAccessToken(user));
      } else if (body.grant_type === GrantType.RefreshToken) {
        if (!body.refresh_token) {
          throw new AccessTokenException(AccessTokenErrorCode.InvalidRequest);
        }
        return response.json(await this.authService.generateRefreshedAccessToken(body.refresh_token));
      } else {
        throw new AccessTokenException(AccessTokenErrorCode.UnsupportedGrantType);
      }
    } catch (err) {
      if (err instanceof AccessTokenException) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          error: err.getErrorCode(),
        });
      }

      this.logger?.error(err, 'Error granting access token');

      throw err;
    }
  }

  async validateWeb3(publicAddress: string, signedMessage: string): Promise<UserIdUsernameDto | null> {
    try {
      return await this.authService.validateWeb3Signature(publicAddress, signedMessage);
    } catch (err) {
      this.logger?.error(err, 'Error validating login info');
      return null;
    }
  }

  async validateRefreshToken(refreshToken: string): Promise<UserIdUsernameDto | null> {
    try {
      return await this.authService.validateRefreshToken(refreshToken);
    } catch (err) {
      this.logger?.error(err, 'Error validating refresh token');
      return null;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async validateWeb3Signature(@Body() body: Web3LoginRequestDto): Promise<AccessTokenResponseDto> {
    try {
      const { publicAddress, signedMessage } = body;
      const user = await this.authService.validateWeb3Signature(publicAddress, signedMessage);

      if (!user) {
        throw new UnauthorizedException();
      }

      const access_token = await this.tokenService.generateAccessToken(user);

      return {
        access_token,
        expires_in: 3600,
        token_type: 'Bearer',
      };
    } catch (err) {
      this.logger?.error(err, 'Error validating login info');

      if (err instanceof UnauthorizedException) {
        throw err;
      }

      throw new UnauthorizedException(err);
    }
  }
}
