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
import { BrightSkyAPI } from './strategies/bright-sky.strategy';

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
    BrightSkyAPI,
  ],
  controllers: [ForecastsController],
  exports: [ForecastsService, BrightSkyAPI],
})
export class ForecastsModule {}
