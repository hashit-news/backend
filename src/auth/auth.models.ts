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

export interface UserRequest extends Request {
  user: UserDto;
}
