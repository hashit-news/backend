import { IsEnum, IsEthereumAddress, IsNotEmpty } from 'class-validator';
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

export enum GrantType {
  Web3 = 'web3',
  RefreshToken = 'refresh_token',
}

export class AccessTokenRequestDto {
  @IsNotEmpty()
  @IsEnum(GrantType)
  grant_type: GrantType;
  refresh_token?: string;
  public_address?: string;
  signed_message?: string;
}

export enum AccessTokenErrorCode {
  InvalidRequest = 'invalid_request',
  InvalidClient = 'invalid_client',
  InvalidGrant = 'invalid_grant',
  InvalidScope = 'invalid_scope',
  UnauthorizedClient = 'unauthorized_client',
  UnsupportedGrantType = 'unsupported_grant_type',
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
