import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { UserDto } from '../users/user.models';
import authConfig from '../common/config/auth.config';
import * as fs from 'fs';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>
  ) {}

  async generateJwtToken(user: UserDto) {
    const { issuer, expiresIn, privateKeyFile } = this.config;
    const algorithm = 'RS256';
    const encoding = 'utf8';
    const privateKey = await fs.promises.readFile(privateKeyFile, encoding);
    const options: JwtSignOptions = {
      issuer,
      expiresIn,
      algorithm,
      encoding,
      privateKey,
    };

    return await this.jwtService.signAsync(user, options);
  }

  async verifyJwtToken(token: string) {
    const { issuer, publicKeyFile } = this.config;
    const algorithm = 'RS256';
    const encoding = 'utf8';
    const publicKey = await fs.promises.readFile(publicKeyFile, encoding);

    return await this.jwtService.verifyAsync<UserDto>(token, {
      issuer,
      algorithms: [algorithm],
      publicKey,
    });
  }
}
