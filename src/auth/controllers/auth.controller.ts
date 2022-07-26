import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ethers } from 'ethers';
import { ProblemDetail } from '../../common/filters/problem-detail/problem-detail.models';
import { RefreshTokenRequest, Web3LoginRequest } from '../dtos/auth.models';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
@ApiResponse({ status: 401, type: ProblemDetail, description: 'Unauthorized' })
@ApiResponse({ status: 403, type: ProblemDetail, description: 'Forbidden' })
@ApiResponse({ status: 404, type: ProblemDetail, description: 'Not found' })
@ApiResponse({ status: 500, type: ProblemDetail, description: 'Internal Service Error' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('web3')
  async getLoginInfo(@Query('walletAddress') walletAddress: string) {
    try {
      return await this.authService.getWeb3LoginInfo(walletAddress);
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

    return { userId: loginInfo.userId, walletAddress: wallet.address, signedMessage };
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getToken(@Body() body: Web3LoginRequest) {
    const { walletAddress, signedMessage } = body;

    return await this.authService.generateWeb3AccessToken(walletAddress, signedMessage);
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  async getRefreshToken(@Body() body: RefreshTokenRequest) {
    const { refreshToken } = body;

    return await this.authService.generateRefreshedAccessToken(refreshToken);
  }
}
