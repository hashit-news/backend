import { IsEthereumAddress, IsNotEmpty } from 'class-validator';
import { UserDto } from '../users/user.models';

export interface Web3LoginInfoDto {
  publicAddress: string;
  signature: string;
}

export class Web3LoginRequestDto {
  @IsEthereumAddress()
  @IsNotEmpty()
  publicAddress: string;

  @IsNotEmpty()
  signedMessage: string;
}

export interface AccessTokenResponseDto {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface UserIdUsernameDto {
  id: string;
  username?: string | null;
}

export interface JwtPayloadDto {
  sub: string;
  name?: string | null;
}

export interface UserRequest extends Request {
  user: UserDto;
}
