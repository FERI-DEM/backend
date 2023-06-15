import { WeatherCodeMapping } from '../types/weather.code.types';
import {
  WeatherWidget,
  WeatherWidgetFull,
} from 'src/modules/forecasts/strategies/get-weather-widget.interface';

export const addDescToStatusCode = (
  statusCode: number,
  wmo: WeatherCodeMapping,
): string => {
  const status = wmo[statusCode.toString()];
  if (status) {
    return status.day.description;
  }
  return '';
};

export const addImageToStatusCode = (
  statusCode: number,
  wmo: WeatherCodeMapping,
): string => {
  const status = wmo[statusCode.toString()];
  if (status) {
    return status.day.image;
  }
  return '';
};

export const addDescToData = (
  weatherWidget: WeatherWidget[],
  wmo: WeatherCodeMapping,
): WeatherWidgetFull[] => {
  const weatherWidgetFull: WeatherWidgetFull[] = weatherWidget.map(
    (weatherWidget: WeatherWidget) => {
      const weatherWidgetFull: WeatherWidgetFull = {
        ...weatherWidget,
        description: addDescToStatusCode(weatherWidget.weathercode, wmo),
        image: addImageToStatusCode(weatherWidget.weathercode, wmo),
        descriptionHourly: weatherWidget.hourly.weathercode.map(
          (weathercode: number) => addDescToStatusCode(weathercode, wmo),
        ),
        imageHourly: weatherWidget.hourly.weathercode.map(
          (weathercode: number) => addImageToStatusCode(weathercode, wmo),
        ),
      };
      return weatherWidgetFull;
    },
  );

  return weatherWidgetFull;
};
