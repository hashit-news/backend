import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import authConfig from '../../common/config/auth.config';
import { PrismaService } from '../../common/database/prisma.service';
import { TokenType } from '@prisma/client';
import { TimeService } from '../../common/time/time.service';
import { JwtPayloadDto, UserIdUsernameDto } from '../dtos/auth.models';
import { FileService } from '../../common/files/file.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly timeService: TimeService,
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    @Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>
  ) {}

  async getJwtSignOptions(issuer: string, privateKeyFile: string, expiresIn?: number): Promise<JwtSignOptions> {
    const algorithm = 'RS256';
    const encoding = 'utf8';
    const privateKey = await this.fileService.readFile(privateKeyFile, encoding);

    const options: JwtSignOptions = {
      issuer,
      algorithm,
      encoding,
      privateKey,
    };

    if (expiresIn) {
      options.expiresIn = expiresIn;
    }

    return options;
  }

  async getJwtVerifyOptions(): Promise<JwtVerifyOptions> {
    const { issuer, publicKeyFile } = this.config;
    const algorithm = 'RS256';
    const encoding = 'utf8';
    const publicKey = await this.fileService.readFile(publicKeyFile, encoding);

    return {
      issuer,
      algorithms: [algorithm],
      publicKey,
    };
  }

  async getAccessTokenSignOptions() {
    const { issuer, expiresIn, privateKeyFile } = this.config;
    return await this.getJwtSignOptions(issuer, privateKeyFile, expiresIn);
  }

  async getRefreshTokenSignOptions() {
    const { issuer, privateKeyFile } = this.config;
    return await this.getJwtSignOptions(issuer, privateKeyFile);
  }

  async generateJwtToken(user: UserIdUsernameDto, options: JwtSignOptions) {
    const payload: JwtPayloadDto = {
      sub: user.id,
    };

    if (user.username) {
      payload.name = user.username;
    }

    return await this.jwtService.signAsync(payload, options);
  }

  async verifyJwtToken(token: string, options: JwtVerifyOptions) {
    return await this.jwtService.verifyAsync<JwtPayloadDto>(token, options);
  }

  async generateAccessToken(user: UserIdUsernameDto) {
    const options = await this.getAccessTokenSignOptions();
    return await this.generateJwtToken(user, options);
  }

  async verifyAccessToken(token: string) {
    const options = await this.getJwtVerifyOptions();
    return await this.jwtService.verifyAsync<JwtPayloadDto>(token, options);
  }

  async generateRefreshToken(user: UserIdUsernameDto) {
    const options = await this.getRefreshTokenSignOptions();
    return await this.generateJwtToken(user, options);
  }

  async getRefreshTokenByUserId(userId: string) {
    return await this.prisma.userToken.findUnique({
      where: {
        userId_tokenType: {
          userId,
          tokenType: TokenType.RefreshToken,
        },
      },
    });
  }

  async upsertUserRefreshToken(userId: string, refreshToken: string) {
    const existing = await this.getRefreshTokenByUserId(userId);

    if (existing) {
      return await this.updateRefreshToken(userId, refreshToken);
    }

    const now = this.timeService.getUtcNow();
    const expiresAt = now.add(this.config.refreshTokenExpiresIn, 'seconds');

    return await this.prisma.userToken.create({
      data: {
        userId,
        token: refreshToken,
        tokenType: TokenType.RefreshToken,
        expiresAt: expiresAt.toDate(),
      },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    return await this.prisma.userToken.update({
      data: {
        token: refreshToken,
      },
      where: {
        userId_tokenType: {
          userId,
          tokenType: TokenType.RefreshToken,
        },
      },
    });
  }

  async revokeRefreshToken(userId: string) {
    return await this.prisma.userToken.delete({
      where: {
        userId_tokenType: {
          userId,
          tokenType: TokenType.RefreshToken,
        },
      },
    });
  }

  async verifyRefreshToken(token: string) {
    const options = await this.getJwtVerifyOptions();
    return await this.jwtService.verifyAsync<JwtPayloadDto>(token, options);
  }
}
