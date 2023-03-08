import {
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  Logger as NestLogger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(null, (exception) => {
        NestLogger.error(exception, 'SentryInterceptor');
        Sentry.captureException(exception);
      }),
    );
  }
}
