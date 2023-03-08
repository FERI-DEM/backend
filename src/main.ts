import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  bootstrapGlobalPipes,
  bootstrapGlobalPrefix,
  bootstrapMiddlewares,
  bootstrapSwagger,
} from './app.bootstrap';
import settings from './app.settings';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  Sentry.init({
    dsn: settings.secrets.sentry,
    tracesSampleRate: 1.0,
  });

  bootstrapMiddlewares(app);
  bootstrapGlobalPrefix(app);
  bootstrapGlobalPipes(app);
  bootstrapSwagger(app);

  await app.listen(settings.app.port);
}

(async (): Promise<void> => {
  try {
    await bootstrap();
  } catch (e) {
    console.error(e);
  }
})();
