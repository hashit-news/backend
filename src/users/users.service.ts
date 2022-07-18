import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async getUserByWalletAddress(walletAddress: string): Promise<UserWalletLoginDto | null> {
    const { isValid, address } = this.web3Service.getAddress(walletAddress);

    if (!isValid) {
      throw new BadRequestException('Invalid public address');
    }

    const user = await this.prisma.user.findUnique({
      where: { walletAddress: address },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  async createWeb3Login(walletAddress: string): Promise<UserWalletLoginDto> {
    const { isValid, address } = this.web3Service.getAddress(walletAddress);

    if (!isValid || !address) {
      throw new BadRequestException('Invalid public address');
    }

    const user = await this.prisma.user.create({
      data: {
        walletAddress: address,
        walletSigningNonce: this.cryptoService.generate256BitSecret(),
        loginAttempts: 0,
        roles: {
          create: [{ roleId: 2 }],
        },
      },
    });

    return user;
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
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      roles: user.roles.map(role => role.role.role),
    };
  }

  async updateLoginSuccess(userId: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoggedInAt: this.timeService.getUtcNow().toDate(),
        loginAttempts: 0,
        lockoutExpiryAt: null,
        walletSigningNonce: this.cryptoService.generate256BitSecret(),
      },
    });
  }

  async updateLoginFailed(userId: string, loginAttempts: number, lockoutExpiryAt?: Date | null) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts,
        lockoutExpiryAt,
        walletSigningNonce: this.cryptoService.generate256BitSecret(),
      },
    });
  }
}
