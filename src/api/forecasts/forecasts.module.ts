import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ForecastsService } from './forecasts.service';
import { ForecastsController } from './forecasts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PVPowerForecast,
  PVPowerForecastSchema,
  SolarRadiation,
  SolarRadiationSchema,
} from './schemas';
import {
  PowerForecastRepository,
  SolarRadiationForecastRepository,
} from './repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PVPowerForecast.name, schema: PVPowerForecastSchema },
      { name: SolarRadiation.name, schema: SolarRadiationSchema },
    ]),
    HttpModule,
  ],
  providers: [
    ForecastsService,
    PowerForecastRepository,
    SolarRadiationForecastRepository,
  ],
  controllers: [ForecastsController],
  exports: [ForecastsService],
})
export class ForecastsModule {}
