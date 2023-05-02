import { DynamicModule, Module } from '@nestjs/common';
import { Client, type DseClientOptions } from 'cassandra-driver';
import { Logger as NestLogger } from '@nestjs/common';

export const CASSANDRA_CLIENT = 'CASSANDRA_CLIENT';

@Module({})
export class CassandraModule {
  static forRoot(config: DseClientOptions): DynamicModule {
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
      global: true,
    };
  }
}
