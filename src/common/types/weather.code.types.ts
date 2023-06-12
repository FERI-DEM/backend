interface WeatherInfo {
  description: string;
  image: string;
}

interface WeatherData {
  day: WeatherInfo;
  night: WeatherInfo;
}

export interface WeatherCodeMapping {
  [key: string]: WeatherData;
}
