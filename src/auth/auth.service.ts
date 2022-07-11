import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from '../common/config/auth.config';
import { TimeService } from '../common/time/time.service';
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
    private readonly timeService: TimeService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>
  ) {
    this.jwtService;
  }

  async getWeb3LoginInfo(publicAddress: string): Promise<Web3LoginInfoResponse> {
    let walletLogin = await this.usersService.getWalletLoginByPublicAddress(publicAddress);

    if (!walletLogin) {
      walletLogin = await this.usersService.createWeb3Login(publicAddress);
    }

    if (walletLogin.lockoutExpiryAt && walletLogin.lockoutExpiryAt > this.timeService.getUtcNow().toDate()) {
      throw new UnauthorizedException('Account is locked');
    }

    // TODO - add friendly message to nonce
    const signature = walletLogin.nonce;

    return { publicAddress: walletLogin.publicAddress, signature };
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

    const existingRefreshToken = await this.tokenService.getRefreshTokenByUserId(user.id);

    const revoke =
      !existingRefreshToken ||
      existingRefreshToken.token !== refreshToken ||
      (existingRefreshToken.expiresAt && existingRefreshToken.expiresAt < this.timeService.getUtcNow().toDate());

    if (revoke) {
      if (existingRefreshToken) {
        await this.tokenService.revokeRefreshToken(user.id);
      }

      throw new UnauthorizedException();
    }

    return this.generateAccessToken(user);
  }

  async validateWeb3Signature(publicAddress: string, signedMessage: string): Promise<UserIdUsernameDto | null> {
    const walletLogin = await this.usersService.getWalletLoginByPublicAddress(publicAddress);

    if (!walletLogin) {
      throw new NotFoundException('Invalid public address');
    }

    if (walletLogin.lockoutExpiryAt && walletLogin.lockoutExpiryAt > this.timeService.getUtcNow().toDate()) {
      throw new UnauthorizedException('Account is locked');
    }

    // TODO - add friendly message to nonce
    const signature = walletLogin.nonce;
    const isValid = this.web3Service.validateSignature(walletLogin.publicAddress, signature, signedMessage);
    if (!isValid) {
      let loginAttempts = 0;
      let lockoutExpiryAt: Date | null = null;

      // if lockout expiry has a value, it means that the user was previously locked out
      // in which case we want to reset their login attempts.
      if (walletLogin.lockoutExpiryAt) {
        loginAttempts = 1;
      } else {
        loginAttempts = walletLogin.loginAttempts + 1;
      }

      if (loginAttempts >= this.config.maxLoginAttempts) {
        lockoutExpiryAt = this.timeService.getUtcNow().add(this.config.lockoutDurationSecs, 'seconds').toDate();
      }

      await this.usersService.updateLoginFailed(walletLogin.userId, loginAttempts, lockoutExpiryAt);

      return null;
    } else {
      await this.usersService.updateLoginSuccess(walletLogin.userId);

      return { id: walletLogin.userId, username: walletLogin.username };
    }
  }

  async validateRefreshToken(refreshToken: string): Promise<UserIdUsernameDto | null> {
    const token = await this.tokenService.verifyRefreshToken(refreshToken);
    if (!token) {
      return null;
    }

    return { id: token.sub, username: token.name };
  }
}
