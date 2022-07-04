import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Web3Service } from '../common/web3/web3.service';
import { UserDto } from '../users/user.models';
import { UsersService } from '../users/users.service';
import { Web3LoginInfoDto } from './auth.models';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly web3Service: Web3Service,
    private readonly configService: ConfigService,

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

  async validateWeb3Signature(publicAddress: string, signedMessage: string): Promise<UserDto | null> {
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

    const user = await this.usersService.getUserById(walletLogin.userId);

    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const { id, username } = user;
    const roles = user.roles.map(x => x.role.role);

    return { id, username, roles };
  }

  async validateLocalAdminUser(username: string, password: string): Promise<UserDto | null> {
    const user = await this.usersService.getUserByUsername(username);
    const localPassword = this.configService.get<string>('SEED_ADMIN_PASSWORD');

    if (user && password === localPassword) {
      const { id, username } = user;
      const roles = user.roles.map(x => x.role.role);

      return { id, username, roles };
    }

    return null;
  }
}
