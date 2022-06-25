import { BadRequestException, Injectable } from '@nestjs/common';
import { User, UserWalletLogin } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Web3Service } from '../web3/web3.service';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly web3Service: Web3Service,
    @InjectPinoLogger(UsersService.name) private readonly logger: PinoLogger
  ) {}

  async getWalletLoginByPublicAddress(publicAddress: string): Promise<UserWalletLogin | undefined> {
    const { isValid, address } = this.web3Service.getAddress(publicAddress);

    if (!isValid) {
      throw new BadRequestException('Invalid public address');
    }

    return await this.prisma.userWalletLogin.findUnique({ where: { publicAddress: address } });
  }

  async createWeb3Login(publicAddress: string): Promise<UserWalletLogin> {
    const { isValid, address } = this.web3Service.getAddress(publicAddress);

    if (!isValid) {
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
            nonce: this.generateNonce(),
          },
        },
      },
      include: { userWalletLogin: true },
    });

    return user.userWalletLogin;
  }

  /**
   * Gets a user by their id
   * @param id Id of the user
   * @returns User
   */
  async getUserById(id: string): Promise<User | undefined> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Gets a user by their username
   * @param username Username of the user
   * @returns User
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    return await this.prisma.user.findUnique({ where: { username } });
  }

  generateNonce(): string {
    return 'test';
  }
}
