import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  GetSolarRadiationInterface,
  Weather,
} from './get-solar-radiation.interface';
import { AxiosResponse } from 'axios';
import { formatDateTo15minInterval } from '../../../common/utils';
import { WeatherWidget } from './get-weather-widget.interface';

import * as fs from 'fs/promises';
import { addDescToData } from 'src/common/utils/wmo.convert';

interface MinutelyData {
  time: string[];
  shortwave_radiation: number[];
  direct_radiation: number[];
  diffuse_radiation: number[];
  direct_normal_irradiance: number[];
  terrestrial_radiation: number[];
}

interface MinutelyDataUnits {
  time: string;
  shortwave_radiation: string;
  direct_radiation: string;
  diffuse_radiation: string;
  direct_normal_irradiance: string;
  terrestrial_radiation: string;
}

interface DailyData {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
}

interface DailyDataUnits {
  time: string;
  weathercode: number;
  temperature_2m_max: string;
  temperature_2m_min: string;
  sunrise: string;
  sunset: string;
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  minutely_15_units: MinutelyDataUnits;
  minutely_15: MinutelyData;
}

export interface OpenMeteoDailyResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily_units: DailyDataUnits;
  daily: DailyData;
}

@Injectable()
export class OpenMeteoAPI implements GetSolarRadiationInterface {
  baseUrl = 'https://api.open-meteo.com/v1/dwd-icon?';

  constructor(private readonly httpService: HttpService) {}

  async getSolarRadiationForecast(
    lat: number,
    lon: number,
  ): Promise<Weather[]> {
    const { data: response } = (await this.httpService.axiosRef.get(
      `${this.baseUrl}latitude=${lat}&longitude=${lon}&minutely_15=shortwave_radiation,direct_radiation,diffuse_radiation,direct_normal_irradiance,terrestrial_radiation,shortwave_radiation_instant,direct_radiation_instant,diffuse_radiation_instant,direct_normal_irradiance_instant,terrestrial_radiation_instant`,
    )) as AxiosResponse<OpenMeteoResponse>;

    const data = response.minutely_15;

    return data.direct_normal_irradiance.map((value, i) => ({
      timestamp: data.time[i],
      solar: value,
    }));
  }

  async getCurrentSolarRadiation(lat: number, lon: number): Promise<Weather> {
    const forecast = await this.getSolarRadiationForecast(lat, lon);
    const formattedDate = formatDateTo15minInterval(new Date());
    return forecast.find(
      (f) => new Date(f.timestamp).getTime() === formattedDate.getTime(),
    );
  }

  async getWeatherForecastWidget(
    lat: number,
    lon: number,
  ): Promise<WeatherWidget[]> {
    const fileData = await fs.readFile('./src/assets/wmo/wmo.json', 'utf8');
    if (!fileData) {
      throw new Error('File not found');
    }
    const wmo = JSON.parse(fileData);

    const { data: response } = (await this.httpService.axiosRef.get(
      `${this.baseUrl}latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Europe%2FLondon`,
    )) as AxiosResponse<OpenMeteoDailyResponse>;

    const data = response.daily;

    const weatherWidget: WeatherWidget[] = data.time.map((value, i) => ({
      weathercode: data.weathercode[i],
      temperature_2m_max: data.temperature_2m_max[i],
      temperature_2m_min: data.temperature_2m_min[i],
      sunrise: data.sunrise[i],
      sunset: data.sunset[i],
    }));

    const weatherWidgetWmo = addDescToData(weatherWidget, wmo);

    return weatherWidgetWmo;
  }
}
