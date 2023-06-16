export interface WeatherWidget {
  weathercode: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherWidgetFull extends WeatherWidget {
  description: string;
  image: string;
  hourlyDataInterval: HourlyInterval;
}

export interface HourlyInterval {
  time: string[];
  description: string[];
  image: string[];
  weatherCode: number[];
}

export interface GetWeatherForecastWidgetFullInterface {
  getWeatherForecastWidget(
    lat: number,
    lon: number,
  ): Promise<WeatherWidgetFull[]>;
}
