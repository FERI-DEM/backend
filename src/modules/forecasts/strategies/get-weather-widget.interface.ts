import { HourlyData } from './open-meteo.strategy';

export interface WeatherWidget {
  weathercode: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  sunrise: string;
  sunset: string;
  hourly: HourlyData;
}

export interface WeatherWidgetFull extends WeatherWidget {
  description: string;
  image: string;
  descriptionHourly: string[];
  imageHourly: string[];
}

export interface GetWeatherForecastWidgetFullInterface {
  getWeatherForecastWidget(
    lat: number,
    lon: number,
  ): Promise<WeatherWidgetFull[]>;
}
