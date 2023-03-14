import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FirebaseService } from '../services';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new HttpException(
        'Missing authorization header',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const token = authorizationHeader.split(' ')[1];
      request.user = await this.firebaseService.auth.verifyIdToken(token);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
