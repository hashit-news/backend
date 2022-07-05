import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CryptoService } from '../common/security/crypto.service';
import { Web3Service } from '../common/web3/web3.service';
import { UserWalletLoginDto } from './user.models';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly web3Service: Web3Service,
    private readonly cryptoService: CryptoService
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
        loginAttempts: 0,
        isLockedOut: false,
        roles: {
          create: [{ roleId: 2 }],
        },
        userWalletLogin: {
          create: {
            publicAddress: address,
            nonce: this.cryptoService.generate256BitSecret(),
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
      include: { roles: { include: { role: true } } },
    });
  }

  /**
   * Gets a user by their username
   * @param username Username of the user
   * @returns User
   */
  async getUserByUsername(username: string) {
    return await this.prisma.user.findUnique({ where: { username }, include: { roles: { include: { role: true } } } });
  }

  async getUserPayloadById(userId: string) {
    const user = this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } }, userWalletLogin: true },
    });

    if (!user) {
      return null;
    }

    return {};
  }
}
