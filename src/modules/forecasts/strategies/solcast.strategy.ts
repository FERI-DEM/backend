import {
  GetSolarRadiationInterface,
  Weather,
} from './get-solar-radiation.interface';
import { HttpService } from '@nestjs/axios';
import { SolarRadiationForecastRepository } from '../repositories';
import settings from '../../../app.settings';
import { AxiosResponse } from 'axios';
import { SolarRadiation } from '../schemas';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SolcastAPI implements GetSolarRadiationInterface {
  constructor(
    private readonly httpService: HttpService,
    private readonly solarRadiationRep: SolarRadiationForecastRepository,
  ) {}

  private baseUrl = 'https://api.solcast.com.au';

  async getSolarRadiationForecast(
    lat: number,
    lon: number,
  ): Promise<Weather[]> {
    const date = new Date();
    date.setHours(date.getHours() - 6);

    const forecast = await this.solarRadiationRep.findOne({
      latitude: lat,
      longitude: lon,
      createdAt: { $gte: date },
    });

    if (forecast) {
      return forecast.forecasts.map((forecast) => ({
        timestamp: new Date(forecast.period_end).toISOString(),
        solar: forecast.ghi,
      }));
    }

    const { data: response } = (await this.httpService.axiosRef.get(
      `${this.baseUrl}/world_radiation/forecasts?latitude=-${lat}&longitude=${lon}&hours=168&api_key=${settings.secrets.solcast}`,
    )) as AxiosResponse<SolarRadiation>;
    await this.solarRadiationRep.create({
      ...response,
      latitude: lat,
      longitude: lon,
    });

    return response.forecasts.map((forecast) => ({
      timestamp: new Date(forecast.period_end).toISOString(),
      solar: forecast.ghi,
    }));
  }

  async getCurrentSolarRadiation(lat: number, lon: number): Promise<Weather> {
    throw new Error('Method not implemented.');
  }
}
