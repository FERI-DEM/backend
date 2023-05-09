import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import {
  GetSolarRadiationInterface,
  Weather,
} from './get-solar-radiation.interface';

@Injectable()
export class BrightSkyAPI implements GetSolarRadiationInterface {
  constructor(private readonly httpService: HttpService) {}

  private baseUrl = 'https://api.brightsky.dev';

  async getSolarRadiationForecast(
    lat: number,
    lon: number,
    lastDate?: Date,
  ): Promise<Weather[]> {
    const dateString = new Date().toISOString().split('T')[0];
    const lastDateString = lastDate?.toISOString().split('T')[0];

    const { data } = (await this.httpService.axiosRef.get(
      `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&date=${dateString}&last_date=${lastDateString}`,
    )) as AxiosResponse<{ weather: Weather[] }>;
    // TODO: we need to match type of solar to the whole app
    return data.weather;
  }

  async getCurrentSolarRadiation(lat: number, lon: number) {
    const { data } = (await this.httpService.axiosRef.get(
      `${this.baseUrl}/current_weather?lat=${lat}&lon=${lon}`,
    )) as AxiosResponse<{
      weather: {
        solar_10: number;
        solar_30: number;
        solar_60: number;
      };
    }>;
    return data.weather;
  }
}
