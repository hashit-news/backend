import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ethers } from 'ethers';
import { RefreshTokenRequest, Web3LoginRequest } from './auth.models';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('web3')
  async getLoginInfo(@Query('publicAddress') publicAddress: string) {
    try {
      return await this.authService.getWeb3LoginInfo(publicAddress);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }

      throw new UnauthorizedException();
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
  async getToken(@Body() body: Web3LoginRequest) {
    const { publicAddress, signedMessage } = body;

    return await this.authService.generateWeb3AccessToken(publicAddress, signedMessage);
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  async getRefreshToken(@Body() body: RefreshTokenRequest) {
    const { refreshToken } = body;

    return await this.authService.generateRefreshedAccessToken(refreshToken);
  }
}
