import * as env from 'env-var';
import { Env } from './common/constants/env.constants';
import * as dotenv from 'dotenv';

const currEnv = process.env.NODE_ENV?.trim() || Env.DEVELOPMENT;

dotenv.config({
  path: `${process.cwd()}/.env.${currEnv}`,
});

const settings = {
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
    cassandra: {
      credentials: {
        username: env.get('CASSANDRA_CLIENT_ID').required(true).asString(),
        password: env.get('CASSANDRA_CLIENT_SECRET').required(true).asString(),
      },
      keyspace: env.get('CASSANDRA_KEYSPACE').required(true).asString(),
      pathToSecureConnectBundle: env
        .get('CASSANDRA_PATH_TO_BUNDLE')
        .required(true)
        .asString(),
    },
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
    firebase: {
      projectId: env.get('FIREBASE_PROJECT_ID').required(true).asString(),
      privateKey: JSON.parse(
        env.get('FIREBASE_PRIVATE_KEY').required(true).asString(),
      ).privateKey,
      clientEmail: env.get('FIREBASE_CLIENT_EMAIL').required(true).asString(),
    },
  },
  secrets: {
    openweather: env.get('WEATHER_API_KEY').required(true).asString(),
    solcast: env.get('SOLCAST_API_KEY').required(true).asString(),
  },
  common: {
    urlPrefix: env.get('URL_PREFIX').required(true).default('api').asString(),
  },
};

export default settings;
