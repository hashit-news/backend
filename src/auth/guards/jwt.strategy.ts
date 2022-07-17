import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as fs from 'fs';
import authConfig from '../../common/config/auth.config';
import { ConfigType } from '@nestjs/config';
import { JwtPayloadDto } from '../dtos/auth.models';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(authConfig.KEY) config: ConfigType<typeof authConfig>,
    private readonly userService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: fs.readFileSync(config.publicKeyFile, 'utf8'),
    });
  }

  async validate(payload: JwtPayloadDto) {
    const user = await this.userService.getUserRequestDataById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
