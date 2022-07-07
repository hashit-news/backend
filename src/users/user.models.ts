import { RoleType } from '@prisma/client';

export interface UserDto {
  id: string;
  username?: string | null;
  publicAddress?: string;
  roles: RoleType[];
}

export interface UserWalletLoginDto {
  userId: string;
  publicAddress: string;
  nonce: string;
  username?: string | null;
}
