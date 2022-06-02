import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from '../users/user.models';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateLocalAdminUser(username: string, password: string): Promise<UserDto | null> {
    const user = await this.usersService.getUserByUsername(username);
    const localPassword = this.configService.get('SEED_ADMIN_PASSWORD');

    console.log('validate', user, localPassword);

    if (user && password === localPassword) {
      return { ...user };
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateUserSignature(address: string, signature: string): Promise<UserDto | null> {
    const user = await this.usersService.getUserById(address);

    if (user) {
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
