import * as env from 'env-var';
import { Env } from '../constants/env.constants';

export default () => ({
  environment: env
    .get('NODE_ENV')
    .required(true)
    .default(Env.DEVELOPMENT)
    .asEnum(Object.values(Env)),
  app: {
    port: env.get('PORT').default(3000).asPortNumber(),
    swaggerPath: env.get('SWAGGER_PATH').default('').asString(),
  },
  database: {
    uri: env.get('DB_URI').required(true).asString(),
  },
  services: {
    sentry: {
      dsn: env.get('SENTRY_DSN').required(true).asString(),
      enabled: env
        .get('SENTRY_ENABLED')
        .required(true)
        .default('true')
        .asBool(),
      tracesSampleRate: env
        .get('SENTRY_TRACES_SAMPLE_RATE')
        .required(true)
        .default(1.0)
        .asFloat(),
    },
  },
  secrets: {
    openweather: env.get('WEATHER_API_KEY').required(true).asString(),
    jwt: env.get('JWT_SECRET').required(true).default('secret').asString(),
  },
  common: {
    urlPrefix: env.get('URL_PREFIX').required(true).default('api').asString(),
  },
});
