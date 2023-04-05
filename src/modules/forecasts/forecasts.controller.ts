import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ForecastsService } from './forecasts.service';
import { PvPowerDto, SolarRadiationDto, WeatherForecastDto } from './dto';
import { AuthGuard } from '../auth/guards';

@ApiTags('forecasts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('forecasts')
export class ForecastsController {
  constructor(private readonly forecastsService: ForecastsService) {}

  @Get('weather/:lat/:lon')
  async getWeather(@Param() dto: WeatherForecastDto) {
    return await this.forecastsService.getWeather(dto);
  }

  @Get('solar-radiation/:lat/:lon')
  async getSolarRadiation(@Param() dto: SolarRadiationDto) {
    return await this.forecastsService.getSolarRadiation(dto);
  }

  @Get('pv-power/:lat/:lon/:dec/:az/:kwp')
  async getPVPower(@Param() dto: PvPowerDto) {
    return await this.forecastsService.getPVPower(dto);
  }
}
