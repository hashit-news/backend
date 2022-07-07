import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UnauthorizedException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  AccessTokenErrorCode,
  AccessTokenErrorResponseDto,
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

  @Get('login')
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

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getToken(@Body() body: AccessTokenRequestDto): Promise<AccessTokenResponseDto | AccessTokenErrorResponseDto> {
    let user: UserIdUsernameDto | null;
    if (body.grant_type === GrantType.Web3) {
      if (!body.public_address || !body.signed_message) {
        return {
          error: AccessTokenErrorCode.InvalidRequest,
        };
      }

      user = await this.validateWeb3(body.public_address, body.signed_message);
    } else if (body.grant_type === GrantType.RefreshToken) {
      if (!body.refresh_token) {
        return {
          error: AccessTokenErrorCode.InvalidRequest,
        };
      }
      user = await this.validateRefreshToken(body.refresh_token);
    } else {
      return {
        error: AccessTokenErrorCode.UnsupportedGrantType,
      };
    }

    if (!user) {
      return {
        error: AccessTokenErrorCode.InvalidGrant,
      };
    }

    const signOptions = await this.tokenService.getAccessTokenSignOptions();
    const token = await this.tokenService.generateJwtToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user);

    return {
      access_token: token,
      expires_in: signOptions.expiresIn as number,
      token_type: 'Bearer',
      refresh_token: refreshToken,
    };
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

      const access_token = await this.tokenService.generateJwtToken(user);

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
