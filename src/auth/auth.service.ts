import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Web3Service } from '../common/web3/web3.service';
import { UsersService } from '../users/users.service';
import { UserIdUsernameDto, Web3LoginInfoDto } from './auth.models';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly web3Service: Web3Service,

    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger
  ) {
    this.jwtService;
  }

  async getWeb3LoginInfo(publicAddress: string): Promise<Web3LoginInfoDto> {
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
    const token = await this.jwtService.verifyAsync(refreshToken);
    if (!token) {
      return null;
    }

    return { id: token.id, username: token.username };
  }
}
