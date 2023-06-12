export interface WeatherWidget {
  weathercode: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  sunrise: string;
  sunset: string;
}

export interface GetWeatherForecastWidgetInterface {
  getWeatherForecastWidget(lat: number, lon: number): Promise<WeatherWidget[]>;
}
