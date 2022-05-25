import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gets a user by their id
   * @param id Id of the user
   * @returns User
   */
  async getUserById(id: string): Promise<User | undefined> {
    return await this.prisma.user.findUnique({ where: { id } });
  }
}
