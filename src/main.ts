import { NestFactory } from '@nestjs/core';
import { Logger as NestLogger } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  bootstrapGlobalFilters,
  bootstrapGlobalInterceptors,
  bootstrapGlobalPipes,
  bootstrapGlobalPrefix,
  bootstrapMiddlewares,
  bootstrapSwagger,
} from './app.bootstrap';
import settings from './app.settings';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  NestLogger.log(`Starting ${settings.environment} server...`, 'Bootstrap');
  const app = await NestFactory.create(AppModule);

  Sentry.init({
    dsn: settings.services.sentry.dsn,
    tracesSampleRate: settings.services.sentry.tracesSampleRate,
    enabled: settings.services.sentry.enabled,
  });

  bootstrapMiddlewares(app);
  bootstrapGlobalPrefix(app);
  bootstrapGlobalPipes(app);
  bootstrapGlobalInterceptors(app);
  bootstrapGlobalFilters(app);
  bootstrapSwagger(app);

  await app.listen(settings.app.port);
  NestLogger.log(`Listening on: ${await app.getUrl()}`, 'Bootstrap');
}

(async (): Promise<void> => {
  try {
    await bootstrap();
  } catch (e) {
    NestLogger.error(e, 'Error');
  }
})();
