import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserWalletLogin } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { CryptoService } from '../common/security/crypto.service';
import { Web3Service } from '../common/web3/web3.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly web3Service: Web3Service,
    private readonly cryptoService: CryptoService
  ) {}

  async getWalletLoginByPublicAddress(publicAddress: string): Promise<UserWalletLogin | null> {
    const { isValid, address } = this.web3Service.getAddress(publicAddress);

    if (!isValid) {
      throw new BadRequestException('Invalid public address');
    }

    return await this.prisma.userWalletLogin.findUnique({ where: { publicAddress: address } });
  }

  async createWeb3Login(publicAddress: string): Promise<UserWalletLogin> {
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

    return user.userWalletLogin;
  }

  /**
   * Gets a user by their id
   * @param id Id of the user
   * @returns User
   */
  async getUserById(id: string) {
    return await this.prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } } } });
  }

  /**
   * Gets a user by their username
   * @param username Username of the user
   * @returns User
   */
  async getUserByUsername(username: string) {
    return await this.prisma.user.findUnique({ where: { username }, include: { roles: { include: { role: true } } } });
  }
}
