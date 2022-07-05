import { RoleEnum } from '@prisma/client';

export interface UserDto {
  id: string;
  username?: string | null;
  walletAddress: string;
  roles: RoleEnum[];
}

export interface UserWalletLoginDto {
  userId: string;
  publicAddress: string;
  nonce: string;
  username?: string | null;
}
