import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import authConfig from '../common/config/auth.config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';
import * as fs from 'fs';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: async (config: ConfigType<typeof authConfig>) => ({
        secretOrPrivateKey: await fs.promises.readFile(config.privateKeyFile, 'utf8'),
        signOptions: {
          expiresIn: config.expiresIn,
          algorithm: 'RS256',
          issuer: config.issuer,
          encoding: 'utf8',
        },
        verifyOptions: {
          issuer: config.issuer,
          algorithms: ['RS256'],
          publicKey: await fs.promises.readFile(config.publicKeyFile, 'utf8'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
