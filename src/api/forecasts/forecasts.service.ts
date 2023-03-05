import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { PvPowerDto, SolarRadiationDto, WeatherForecastDto } from './dto';
import settings from '../../app.settings';
import { PowerForecastRepository } from './repositories/power-forecast.repository';

@Injectable()
export class ForecastsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly powerForecastRep: PowerForecastRepository,
  ) {}

  async getWeather(data: WeatherForecastDto) {
    const { lat, lon } = data;
    try {
      const { data: response } = await this.httpService.axiosRef.get(
        `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&appid=${settings.keys.openweather}`,
      );
      return response;
    } catch (e) {
      const err = e as AxiosError;
      console.log(err.request);
    }
  }

  async getSolarRadiation(data: SolarRadiationDto) {
    return {
      coord: {
        lon: data.lon,
        lat: data.lat,
      },
      list: [
        {
          radiation: {
            ghi: 199.52,
            dni: 2,
            dhi: 197.94,
            ghi_cs: 798.07,
            dni_cs: 877.92,
            dhi_cs: 113.36,
          },
          dt: 1627905600,
        },
        {
          radiation: {
            ghi: 206.68,
            dni: 2.27,
            dhi: 204.83,
            ghi_cs: 826.71,
            dni_cs: 885.47,
            dhi_cs: 114.93,
          },
          dt: 1627909200,
        },
        {
          radiation: {
            ghi: 213.84,
            dni: 2.54,
            dhi: 211.72,
            ghi_cs: 855.35,
            dni_cs: 893.02,
            dhi_cs: 116.5,
          },
          dt: 1627912800,
        },
      ],
    };
  }

  async;

  async getPVPower(data: PvPowerDto) {
    const { lat, lon, dec, az, kwp } = data;
    const date = new Date();
    date.setHours(date.getHours() - 6);

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
