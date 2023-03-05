import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ForecastsService } from './forecasts.service';
import { ForecastsController } from './forecasts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PVPowerForecast,
  PVPowerForecastSchema,
} from './schemas/pv-power.schemas';
import { PowerForecastRepository } from './repositories/power-forecast.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PVPowerForecast.name, schema: PVPowerForecastSchema },
    ]),
    HttpModule,
  ],
  providers: [ForecastsService, PowerForecastRepository],
  controllers: [ForecastsController],
})
export class ForecastsModule {}
