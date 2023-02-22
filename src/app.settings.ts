import * as env from 'env-var';
import { Env } from './common/constants/env.constants';

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
  common: {
    urlPrefix: env.get('URL_PREFIX').required(true).default('api').asString(),
  },
};

export default settings;
