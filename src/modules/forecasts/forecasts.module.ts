import { Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
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
import { SolcastAPI } from './strategies/solcast.strategy';
import { OpenMeteoAPI } from './strategies/open-meteo.strategy';

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
    SolcastAPI,
    OpenMeteoAPI,
  ],
  controllers: [ForecastsController],
  exports: [ForecastsService, BrightSkyAPI, SolcastAPI, OpenMeteoAPI],
})
export class ForecastsModule {}
