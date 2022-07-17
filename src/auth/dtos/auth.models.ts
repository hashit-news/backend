import { IsEthereumAddress, IsNotEmpty } from 'class-validator';
import { UserDto } from '../../users/user.models';

export interface Web3LoginInfoResponse {
  publicAddress: string;
  signature: string;
}

export class Web3LoginRequest {
  @IsEthereumAddress()
  @IsNotEmpty()
  publicAddress: string;

  @IsNotEmpty()
  signedMessage: string;
}

export class RefreshTokenRequest {
  @IsNotEmpty()
  refreshToken: string;
}

export interface AccessTokenResponse {
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
