import { WeatherCodeMapping } from '../types/weather.code.types';
import { WeatherWidget } from 'src/modules/forecasts/strategies/get-weather-widget.interface';

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
): WeatherWidget[] => {
  return weatherWidget.map((widget) => {
      widget.description = addDescToStatusCode(widget.weathercode, wmo);
widget.image = addImageToStatusCode(widget.weathercode, wmo);
        return widget;
    });
};
