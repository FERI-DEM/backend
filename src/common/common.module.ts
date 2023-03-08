import { Global, Module } from '@nestjs/common';
import { SentryInterceptor } from './interceptors';

@Global()
@Module({
  providers: [SentryInterceptor],
  exports: [SentryInterceptor],
})
export class CommonModule {}
