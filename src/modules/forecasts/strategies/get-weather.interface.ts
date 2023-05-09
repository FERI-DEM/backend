export interface Weather {
  solar: number;
  timestamp: string;
}

export interface GetWeatherInterface {
  getWeather(lat: number, lon: number): Promise<Weather[]>;
}
