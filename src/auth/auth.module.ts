import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import authConfig from '../common/config/auth.config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './guards/jwt.strategy';
import { TokenService } from './services/token.service';
import * as fs from 'fs';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: async (config: ConfigType<typeof authConfig>) => ({
        privateKey: await fs.promises.readFile(config.privateKeyFile, 'utf8'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
