import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UnauthorizedException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Web3LoginRequestDto } from './auth.models';
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async validateWeb3Signature(@Body() body: Web3LoginRequestDto) {
    try {
      const { publicAddress, signedMessage } = body;
      const user = await this.authService.validateWeb3Signature(publicAddress, signedMessage);

      if (!user) {
        throw new UnauthorizedException();
      }

      const access_token = await this.tokenService.generateJwtToken(user);

      return {
        access_token,
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
