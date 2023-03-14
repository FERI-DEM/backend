import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { PvPowerDto, SolarRadiationDto, WeatherForecastDto } from './dto';
import settings from '../../app.settings';
import {
  PowerForecastRepository,
  SolarRadiationForecastRepository,
} from './repositories';

@Injectable()
export class ForecastsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly powerForecastRep: PowerForecastRepository,
    private readonly solarRadiationRep: SolarRadiationForecastRepository,
  ) {}

  async getWeather(data: WeatherForecastDto) {
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
    const { lat, lon } = data;
    const { data: response } = await this.httpService.axiosRef.get(
      `https://api.solcast.com.au/world_radiation/estimated_actuals?latitude=-${lat}&longitude=${lon}&hours=168&api_key=${settings.secrets.solcast}`,
    );

    return await this.solarRadiationRep.create(response);
  }

  async;

  async getPVPower(data: PvPowerDto) {
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
