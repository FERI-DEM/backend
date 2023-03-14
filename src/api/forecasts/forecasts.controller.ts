import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ForecastsService } from './forecasts.service';
import { PvPowerDto, SolarRadiationDto, WeatherForecastDto } from './dto';

@ApiTags('forecasts')
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

  @Get('predict')
  async predict() {
    // 24 urna napoved
    // 8.3.2023 ob 12:00
    const MARC_8_1200_POWER = 45.75;
    const MARC_8_1200_RAD = 452;
    const koef1 = MARC_8_1200_POWER / MARC_8_1200_RAD;

    // 9.3.2023 ob 12:00
    const MARC__9_1200_POWER = 27.09;
    const MARC_9_1200_RAD = 200;
    const koef2 = MARC__9_1200_POWER / MARC_9_1200_RAD;
    // predict 20.24336283185841
    const predict1 = koef1 * MARC_9_1200_RAD;
    //return predict1;

    // 10.3.2023 ob 12:00
    const MARC__10_1200_POWER = 47.82;
    const MARC_10_1200_RAD = 338;
    // predict power 45.78209999999999
    const predict2 = koef2 * MARC_10_1200_RAD;
    //return predict2;

    // 30 min napoved
    // 8.3.2023 ob 12:30
    const MARC_8_1230_POWER = 40.43;
    const MARC_8_1230_RAD = 483;

    // predict power 48.887721238938056
    const predict3 = koef1 * MARC_8_1230_RAD;
    // return predict3;

    // 9.3.2023 ob 12:30
    const MARC__9_1230_POWER = 39.97;
    const MARC_9_1230_RAD = 289;
    // predict power 39.14505
    const predict4 = koef2 * MARC_9_1230_RAD;
    // return predict4;

    // 10.3.2023 ob 12:30
    const MARC__10_1230_POWER = 47.16;
    const MARC_10_1230_RAD = 335;
    const koef3 = MARC__10_1200_POWER / MARC_10_1200_RAD;
    // predict power 47.39556213017751
    const predict5 = koef3 * MARC_10_1230_RAD;
    //return predict5;
  }
}
