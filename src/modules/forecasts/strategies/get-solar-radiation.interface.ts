export interface Weather {
  solar: number;
  timestamp: string;
}

export interface GetSolarRadiationInterface {
  getSolarRadiationForecast(lat: number, lon: number): Promise<Weather[]>;
}
