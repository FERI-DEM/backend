import * as env from 'env-var';
import { Deployment, Env } from '../constants/env.constants';

export default () => ({
  environment: env
    .get('NODE_ENV')
    .required(true)
    .default(Env.DEVELOPMENT)
    .asEnum(Object.values(Env)),
  deployment: env
    .get('DEPLOYMENT')
    .default(Deployment.CLOUD)
    .asEnum(Object.values(Deployment)),
  app: {
    port: env.get('PORT').default(3000).asPortNumber(),
    swaggerPath: env.get('SWAGGER_PATH').default('').asString(),
  },
  database: {
    uri: env.get('DB_URI').required(true).asString(),
    cassandra: {
      localDataCenter: env
        .get('CASSANDRA_LOCAL_DATA_CENTER')
        .required(false)
        .asString(),
      contactPoints: env
        .get('CASSANDRA_CONTACT_POINTS')
        .required(false)
        .asString(),
      credentials: {
        username: env.get('CASSANDRA_CLIENT_ID').required(true).asString(),
        password: env.get('CASSANDRA_CLIENT_SECRET').required(true).asString(),
      },
      keyspace: env.get('CASSANDRA_KEYSPACE').required(true).asString(),
      pathToSecureConnectBundle: env
        .get('CASSANDRA_PATH_TO_BUNDLE')
        .required()
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
});
