import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Web3Service } from '../common/web3/web3.service';
import { UsersService } from '../users/users.service';
import { AccessTokenResponse, UserIdUsernameDto, Web3LoginInfoResponse } from './auth.models';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly web3Service: Web3Service,
    private readonly tokenService: TokenService,

    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger
  ) {
    this.jwtService;
  }

  async getWeb3LoginInfo(publicAddress: string): Promise<Web3LoginInfoResponse> {
    let walletLogin = await this.usersService.getWalletLoginByPublicAddress(publicAddress);

    if (!walletLogin) {
      walletLogin = await this.usersService.createWeb3Login(publicAddress);
    }

    // TODO - add friendly message to nonce
    const signature = walletLogin.nonce;

    return { publicAddress: walletLogin.publicAddress, signature };
  }

  async validateWeb3Signature(publicAddress: string, signedMessage: string): Promise<UserIdUsernameDto | null> {
    const walletLogin = await this.usersService.getWalletLoginByPublicAddress(publicAddress);

    if (!walletLogin) {
      throw new NotFoundException('Invalid public address');
    }

    // TODO - add friendly message to nonce
    const signature = walletLogin.nonce;
    const isValid = this.web3Service.validateSignature(walletLogin.publicAddress, signature, signedMessage);
    if (!isValid) {
      this.logger?.debug(
        { walletLogin },
        'Unable to validate signature for user id %s publicAddress %s',
        walletLogin.userId,
        walletLogin.publicAddress
      );

      return null;
    }

    return { id: walletLogin.userId, username: walletLogin.username };
  }

  async validateRefreshToken(refreshToken: string): Promise<UserIdUsernameDto | null> {
    const token = await this.tokenService.verifyRefreshToken(refreshToken);
    if (!token) {
      return null;
    }

    return { id: token.sub, username: token.name };
  }

  async generateAccessToken(user: UserIdUsernameDto): Promise<AccessTokenResponse> {
    const signOptions = await this.tokenService.getAccessTokenSignOptions();
    const token = await this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user);
    await this.tokenService.upsertUserRefreshToken(user.id, refreshToken);

    return {
      access_token: token,
      expires_in: signOptions.expiresIn as number,
      token_type: 'Bearer',
      refresh_token: refreshToken,
    };
  }

  async generateWeb3AccessToken(publicAddress: string, signedMessage: string): Promise<AccessTokenResponse> {
    const user = await this.validateWeb3Signature(publicAddress, signedMessage);

    if (!user) {
      throw new UnauthorizedException();
    }

    return await this.generateAccessToken(user);
  }

  async generateRefreshedAccessToken(refreshToken: string): Promise<AccessTokenResponse> {
    const user = await this.validateRefreshToken(refreshToken);

    if (!user) {
      throw new UnauthorizedException();
    }

    const existingRefreshToken = await this.tokenService.getRefreshToken(user.id);

    const revoke =
      !existingRefreshToken ||
      existingRefreshToken.token !== refreshToken ||
      (existingRefreshToken.expiresAt && existingRefreshToken.expiresAt < moment.utc().toDate());

    if (revoke) {
      await this.tokenService.revokeRefreshToken(user.id);
      throw new UnauthorizedException();
    }

    return this.generateAccessToken(user);
  }
}
