import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

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
