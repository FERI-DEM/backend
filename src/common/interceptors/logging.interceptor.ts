import { tap } from 'rxjs/operators';
import {
  CallHandler,
  ExecutionContext,
  Logger as NestLogger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() =>
          NestLogger.log(
            `${request.method} ${request.url} ${response.statusCode} ${
              Date.now() - now
            }ms`,
            context.getClass().name,
          ),
        ),
      );
  }
}
