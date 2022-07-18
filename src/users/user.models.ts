import { RoleType } from '@prisma/client';

export interface UserDto {
  id: string;
  username?: string | null;
  walletAddress?: string;
  roles: RoleType[];
}

export interface UserWalletLoginDto {
  id: string;
  walletAddress: string;
  walletSigningNonce: string;
  username?: string | null;
  loginAttempts: number;
  lockoutExpiryAt?: Date | null;
}
