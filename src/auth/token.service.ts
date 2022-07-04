import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { UserDto } from '../users/user.models';
import authConfig from '../common/config/auth.config';
import * as fs from 'fs';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>
  ) {}

  async getJwtSignOptions(): Promise<JwtSignOptions> {
    const { issuer, expiresIn, privateKeyFile } = this.config;
    const algorithm = 'RS256';
    const encoding = 'utf8';
    const privateKey = await fs.promises.readFile(privateKeyFile, encoding);

    return {
      issuer,
      expiresIn,
      algorithm,
      encoding,
      privateKey,
    };
  }

  async getJwtVerifyOptions(): Promise<JwtVerifyOptions> {
    const { issuer, publicKeyFile } = this.config;
    const algorithm = 'RS256';
    const encoding = 'utf8';
    const publicKey = await fs.promises.readFile(publicKeyFile, encoding);

    return {
      issuer,
      algorithms: [algorithm],
      publicKey,
    };
  }

  async generateJwtToken(user: UserDto) {
    const options = await this.getJwtSignOptions();
    return await this.jwtService.signAsync(user, options);
  }

  async verifyJwtToken(token: string) {
    const options = await this.getJwtVerifyOptions();
    return await this.jwtService.verifyAsync<UserDto>(token, options);
  }
}
