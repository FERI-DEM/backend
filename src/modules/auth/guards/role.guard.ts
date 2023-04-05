import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../common/types';
import { ROLES_KEY } from '../../../common/decorators';
import { AuthService } from '../auth.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();

    if (!user.hasOwnProperty('roles')) {
      throw new HttpException(
        'User does not have any roles',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.roles.includes(Role.ADMIN)) return true;

    return await this.auth.validateRole(requiredRoles, user.roles);
  }
}
