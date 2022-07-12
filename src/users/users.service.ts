import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CryptoService } from '../common/security/crypto.service';
import { TimeService } from '../common/time/time.service';
import { Web3Service } from '../common/web3/web3.service';
import { UserDto, UserWalletLoginDto } from './user.models';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly web3Service: Web3Service,
    private readonly cryptoService: CryptoService,
    private readonly timeService: TimeService
  ) {}

  async getWalletLoginByPublicAddress(publicAddress: string): Promise<UserWalletLoginDto | null> {
    const { isValid, address } = this.web3Service.getAddress(publicAddress);

    if (!isValid) {
      throw new BadRequestException('Invalid public address');
    }

    const userWalletLogin = await this.prisma.userWalletLogin.findUnique({
      where: { publicAddress: address },
      include: { user: true },
    });

    if (!userWalletLogin) {
      return null;
    }

    return { ...userWalletLogin, username: userWalletLogin.user.username };
  }

  async createWeb3Login(publicAddress: string): Promise<UserWalletLoginDto> {
    const { isValid, address } = this.web3Service.getAddress(publicAddress);

    if (!isValid || !address) {
      throw new BadRequestException('Invalid public address');
    }

    const user = await this.prisma.user.create({
      data: {
        roles: {
          create: [{ roleId: 2 }],
        },
        userWalletLogin: {
          create: {
            publicAddress: address,
            nonce: this.cryptoService.generate256BitSecret(),
            loginAttempts: 0,
          },
        },
      },
      include: { userWalletLogin: true },
    });

    if (!user.userWalletLogin) {
      throw new InternalServerErrorException('Unable to create wallet login');
    }

    return { ...user.userWalletLogin, username: user.username };
  }

  /**
   * Gets a user by their id
   * @param userId Id of the user
   * @returns User
   */
  async getUserById(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Gets a user by their username
   * @param username Username of the user
   * @returns User
   */
  async getUserByUsername(username: string) {
    return await this.prisma.user.findUnique({ where: { username } });
  }

  async getUserRequestDataById(userId: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } }, userWalletLogin: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.userWalletLogin) {
      throw new NotFoundException('User wallet login not found');
    }

    return {
      id: user.id,
      username: user.username,
      publicAddress: user.userWalletLogin.publicAddress,
      roles: user.roles.map(role => role.role.role),
    };
  }

  async updateLoginSuccess(userId: string) {
    return await this.prisma.userWalletLogin.update({
      where: { userId: userId },
      data: {
        lastLoggedInAt: this.timeService.getUtcNow().toDate(),
        loginAttempts: 0,
        lockoutExpiryAt: null,
        nonce: this.cryptoService.generate256BitSecret(),
      },
    });
  }

  async updateLoginFailed(userId: string, loginAttempts: number, lockoutExpiryAt?: Date | null) {
    return await this.prisma.userWalletLogin.update({
      where: { userId: userId },
      data: {
        loginAttempts,
        lockoutExpiryAt,
        nonce: this.cryptoService.generate256BitSecret(),
      },
    });
  }
}
