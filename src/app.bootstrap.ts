import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import settings from './app.settings';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SentryInterceptor } from './common/interceptors';
import { ExceptionsFilter } from './common/filters';
import { HttpAdapterHost } from '@nestjs/core';

export const bootstrapMiddlewares = (
  app: INestApplication,
): INestApplication => {
  app.use(helmet());
  app.use(compression());
  app.enableCors({ origin: '*' });

  return app;
};

export const bootstrapGlobalPrefix = (
  app: INestApplication,
): INestApplication => {
  app.setGlobalPrefix(settings.common.urlPrefix, {
    exclude: [
      {
        path: 'health',
        method: RequestMethod.GET,
      },
    ],
  });

  return app;
};

export const bootstrapGlobalPipes = (
  app: INestApplication,
): INestApplication => {
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  return app;
};

export const bootstrapGlobalInterceptors = (
  app: INestApplication,
): INestApplication => {
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new SentryInterceptor());

  return app;
};

export const bootstrapGlobalFilters = (
  app: INestApplication,
): INestApplication => {
  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ExceptionsFilter(adapterHost));

  return app;
};

export const bootstrapSwagger = (app: INestApplication): INestApplication => {
  const config = new DocumentBuilder()
    .setTitle('SolarX API')
    .setDescription('SolarX API napove proizvodnjo energije elektrarne.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(settings.app.swaggerPath, app, document);

  return app;
};
