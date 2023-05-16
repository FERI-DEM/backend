import { Module } from '@nestjs/common';
import { PowerPlantsController } from './power-plants.controller';
import { PowerPlantsService } from './power-plants.service';
import { PowerPlantRepository } from './repository/power-plant.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ForecastsModule } from '../forecasts/forecasts.module';
import { UsersModule } from '../users/users.module';
import { CassandraModule } from '../../common/modules';
import settings from '../../app.settings';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CassandraModule.forRoot({
      cloud: {
        secureConnectBundle:
          settings.database.cassandra.pathToSecureConnectBundle,
      },
      credentials: {
        username: settings.database.cassandra.credentials.username,
        password: settings.database.cassandra.credentials.password,
      },
      keyspace: settings.database.cassandra.keyspace,
      socketOptions: {
        readTimeout: 0,
      },
    }),
    ForecastsModule,
    UsersModule,
  ],
  controllers: [PowerPlantsController],
  providers: [PowerPlantsService, PowerPlantRepository],
  exports: [PowerPlantsService],
})
export class PowerPlantsModule {}
