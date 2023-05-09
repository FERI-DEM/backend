import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { GetWeatherInterface, Weather } from './get-weather.interface';

@Injectable()
export class BrightSkyAPI implements GetWeatherInterface {
  constructor(private readonly httpService: HttpService) {}

  private baseUrl = 'https://api.brightsky.dev';

  async getWeather(lat: number, lon: number): Promise<Weather[]> {
    const dateString = new Date().toISOString().split('T')[0];
    const { data } = (await this.httpService.axiosRef.get(
      `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&date=${dateString}`,
    )) as AxiosResponse<{ weather: Weather[] }>;
    return data.weather;
  }
}
