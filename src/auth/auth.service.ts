import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/users/user.models';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

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
