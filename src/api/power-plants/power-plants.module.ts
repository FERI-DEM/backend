import { Module } from '@nestjs/common';
import { PowerPlantsController } from './power-plants.controller';
import { PowerPlantsService } from './power-plants.service';
import { PowerPlantRepository } from './repository/power-plant.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ForecastsModule } from '../forecasts/forecasts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ForecastsModule,
  ],
  controllers: [PowerPlantsController],
  providers: [PowerPlantsService, PowerPlantRepository],
})
export class PowerPlantsModule {}
