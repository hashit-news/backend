import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Web3Service } from '../common/web3/web3.service';
import { UserDto } from '../users/user.models';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly web3Service: Web3Service,
    private readonly configService: ConfigService,

    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger
  ) {}

  async getOrCreateWalletLogin(publicAddress: string) {
    let walletLogin = await this.usersService.getWalletLoginByPublicAddress(publicAddress);

    if (!walletLogin) {
      walletLogin = await this.usersService.createWeb3Login(publicAddress);
    }

    // TODO - add friendly message to nonce
    const unsignedMessage = walletLogin.nonce;

    return { publicAddress: walletLogin.publicAddress, unsignedMessage };
  }

  async validateUserSignature(publicAddress: string, signature: string): Promise<UserDto | null> {
    const walletLogin = await this.usersService.getWalletLoginByPublicAddress(publicAddress);

    if (!walletLogin) {
      throw new HttpException('Invalid public address', HttpStatus.NOT_FOUND);
    }

    // TODO - add friendly message to nonce
    const unsignedMessage = walletLogin.nonce;
    const result = this.web3Service.validateSignature(walletLogin.publicAddress, signature, unsignedMessage);

    if (!result.isValid) {
      this.logger?.debug(
        { walletLogin, error: result.error },
        'Unable to validate signature for user id %s publicAddress %s',
        walletLogin.userId,
        walletLogin.publicAddress
      );

      return null;
    }

    const user = await this.usersService.getUserById(walletLogin.userId);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const { id, username } = user;

    return { id, username };
  }

  async validateLocalAdminUser(username: string, password: string): Promise<UserDto | null> {
    const user = await this.usersService.getUserByUsername(username);
    const localPassword = this.configService.get<string>('SEED_ADMIN_PASSWORD');

    if (user && password === localPassword) {
      return { ...user };
    }

    return null;
  }

  async generateJwt(user: UserDto) {
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
