import { IsEthereumAddress, IsNotEmpty } from 'class-validator';
import { UserDto } from '../../users/user.models';

export class Web3LoginInfoResponse {
  walletAddress: string;
  signature: string;
}

export class Web3LoginRequest {
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @IsNotEmpty()
  signedMessage: string;
}

export class RefreshTokenRequest {
  @IsNotEmpty()
  refreshToken: string;
}

export class AccessTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export class UserIdUsernameDto {
  id: string;
  username?: string | null;
}

export class JwtPayloadDto {
  sub: string;
  name?: string | null;
}

export interface UserRequest extends Request {
  user: UserDto;
}
