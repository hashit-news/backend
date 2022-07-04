import { RoleEnum } from '@prisma/client';

export interface UserDto {
  id: string;
  username?: string | null;
  roles: RoleEnum[];
}
