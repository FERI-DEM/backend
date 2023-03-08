import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UsersService } from '../../api/users/users.service';
import { Reflector } from '@nestjs/core';
import { Role } from '../types';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    const { role: userRole } = await this.usersService.findById(user.id);
    return requiredRoles.some((role) => userRole.includes(role));
  }
}
