import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { AxiosError, AxiosResponse } from 'axios';
import { PvPowerDto, SolarRadiationDto, WeatherForecastDto } from './dto';
import settings from '../../app.settings';
import {
  PowerForecastRepository,
  SolarRadiationForecastRepository,
} from './repositories';
import { PVPowerForecastDocument } from './schemas';
import { SolcastAPI } from './strategies/solcast.strategy';
import { BrightSkyAPI } from './strategies/bright-sky.strategy';
import { OpenMeteoAPI } from './strategies/open-meteo.strategy';

@Injectable()
export class ForecastsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly powerForecastRep: PowerForecastRepository,
    private readonly solarRadiationRep: SolarRadiationForecastRepository,
    private readonly bri: BrightSkyAPI,
    private readonly solcast: SolcastAPI,
  ) {}

  async getWeather(data: WeatherForecastDto): Promise<AxiosResponse> {
    const { lat, lon } = data;
    try {
      const { data: response } = await this.httpService.axiosRef.get(
        `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&appid=${settings.secrets.openweather}`,
      );
      return response;
    } catch (e) {
      const err = e as AxiosError;
      console.log(err.request);
    }
  }

  async getSolarRadiation(data: SolarRadiationDto) {
    return await this.solcast.getSolarRadiationForecast(data.lat, data.lon);
  }

  async getPVPower(data: PvPowerDto): Promise<PVPowerForecastDocument> {
    const { lat, lon, dec, az, kwp } = data;

    const date = new Date();
    date.setHours(date.getHours() - 2);

    const forecast = await this.powerForecastRep.findOne({
      'message.info.latitude': lat,
      'message.info.longitude': lon,
      createdAt: { $gte: date },
    });

    if (!forecast) {
      const { data: response } = await this.httpService.axiosRef.get(
        `https://api.forecast.solar/estimate/${lat}/${lon}/${dec}/${az}/${kwp}`,
      );
      await this.powerForecastRep.create(response);
      return response;
    }

    return forecast;
  }
}
