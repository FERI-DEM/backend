import {
  Controller,
  Get,
  HttpException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ForecastsService } from './forecasts.service';
import { PvPowerDto, SolarRadiationDto, WeatherForecastDto } from './dto';
import { AuthGuard } from '../auth/guards';

@ApiTags('forecasts')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@Controller('forecasts')
export class ForecastsController {
  constructor(private readonly forecastsService: ForecastsService) {}

  @Get('current')
  async getCurrent() {
    try {
      return await this.forecastsService.getCurrentSolarRadiation();
    } catch (e) {
      throw new HttpException(e.message, e.status);
    }
  }

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
