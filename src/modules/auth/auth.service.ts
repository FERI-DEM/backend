import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RequestUser, Role } from '../../common/types';
import { FirebaseService } from '../../common/services';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(token: string): Promise<RequestUser> {
    const { email, uid } = await this.firebase.auth.verifyIdToken(token);

    const user = await this.usersService.findByEmail(email);
    if (user) {
      return {
        email: user.email,
        userId: user.userId,
        roles: user.roles,
        id: user.id,
      };
    }

    try {
      const user = await this.usersService.create({ email, userId: uid });
      return {
        email: user.email,
        userId: user.userId,
        roles: user.roles,
        id: user.id,
      };
    } catch (err) {
      throw new HttpException((err as Error).message, 500);
    }
  }

  async validateRole(
    requiredRoles: Role[],
    userRoles: Role[],
  ): Promise<boolean> {
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new HttpException(
        `This resource is forbidden for this user that do not have the following roles: ${requiredRoles}`,
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
