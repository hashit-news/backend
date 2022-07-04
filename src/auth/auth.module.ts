import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
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
    JwtModule.register({
      secretOrPrivateKey: fs.readFileSync('./private.key', 'utf8'),
      signOptions: {
        expiresIn: '1h',
        algorithm: 'RS256',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService],
  exports: [AuthService],
})
export class AuthModule {}
