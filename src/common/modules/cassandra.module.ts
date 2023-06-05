import { DynamicModule, Module } from '@nestjs/common';
import { Client, type DseClientOptions } from 'cassandra-driver';
import { Logger as NestLogger } from '@nestjs/common';
import settings from '../../app.settings';
import { Env } from '../constants/env.constants';

export const CASSANDRA_CLIENT = 'CASSANDRA_CLIENT';

@Module({})
export class CassandraModule {
  static forRoot(config: DseClientOptions): DynamicModule {
    if (settings.environment === Env.TEST) {
      return {
        module: CassandraModule,
        providers: [
          {
            provide: CASSANDRA_CLIENT,
            useValue: null,
          },
        ],
        exports: [CASSANDRA_CLIENT],
        global: false,
      };
    }

    const client = new Client(config);

    const CassandraProvider = {
      provide: CASSANDRA_CLIENT,
      useValue: client,
    };

    client
      .connect()
      .then(() => {
        NestLogger.log('Connected to Cassandra', 'CassandraModule');
      })
      .catch((err) => {
        NestLogger.error(err, 'CassandraModule');
      });

    return {
      module: CassandraModule,
      providers: [CassandraProvider],
      exports: [CassandraProvider],
      global: false,
    };
  }
}
