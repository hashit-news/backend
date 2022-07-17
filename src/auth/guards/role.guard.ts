import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { ROLES_KEY } from '../decorators/role.decorator';
import { UserRequest } from '../dtos/auth.models';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length < 1) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<UserRequest>();

    if (!user) {
      return false;
    }

    if (!user.roles) {
      return false;
    }

    return requiredRoles.some(role => user.roles.includes(role));
  }
}
