import { HourlyData } from './../../modules/forecasts/strategies/open-meteo.strategy';
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

const addDescToHourlyDataForSpecificDay = (
  hourlyData: HourlyData,
  wmo: WeatherCodeMapping,
  day: number,
): string[] => {
  const hourlyDataDesc: string[] = hourlyData.time
    .map((time: string, index: number) => {
      if (new Date(time).getDay() === day) {
        const statusCode = hourlyData.weathercode[index];
        return addDescToStatusCode(statusCode, wmo);
      }
      return null;
    })
    .filter((desc) => desc !== null);
  return hourlyDataDesc;
};

const addImageToHourlyDataForSpecificDay = (
  hourlyData: HourlyData,
  wmo: WeatherCodeMapping,
  day: number,
): string[] => {
  const hourlyDataImage: string[] = hourlyData.time
    .map((time: string, index: number) => {
      if (new Date(time).getDay() === day) {
        const statusCode = hourlyData.weathercode[index];
        return addImageToStatusCode(statusCode, wmo);
      }
      return null;
    })
    .filter((image) => image !== null);
  return hourlyDataImage;
};

const addTimeToHourlyDataForSpecificDay = (
  hourlyData: HourlyData,
  day: number,
): string[] => {
  const hourlyDataTime: string[] = hourlyData.time
    .map((time: string) => {
      if (new Date(time).getDay() === day) {
        return time;
      }
      return null;
    })
    .filter((time) => time !== null);
  return hourlyDataTime;
};

const addWeatherCodeToHourlyDataForSpecificDay = (
  hourlyData: HourlyData,
  day: number,
): number[] => {
  const hourlyDataWeatherCode: number[] = hourlyData.time
    .map((time: string, index: number) => {
      if (new Date(time).getDay() === day) {
        return hourlyData.weathercode[index];
      }
      return null;
    })
    .filter((code) => code !== null);
  return hourlyDataWeatherCode;
};

export const addDescToData = (
  weatherWidget: WeatherWidget[],
  wmo: WeatherCodeMapping,
  hourlyData: HourlyData,
): WeatherWidgetFull[] => {
  const weatherWidgetFull: WeatherWidgetFull[] = weatherWidget.map(
    (weatherWidget: WeatherWidget) => {
      const weatherWidgetFull: WeatherWidgetFull = {
        ...weatherWidget,
        description: addDescToStatusCode(weatherWidget.weathercode, wmo),
        image: addImageToStatusCode(weatherWidget.weathercode, wmo),
        hourlyDataInterval: {
          time: addTimeToHourlyDataForSpecificDay(
            hourlyData,
            new Date(weatherWidget.sunrise).getDay(),
          ),
          weatherCode: addWeatherCodeToHourlyDataForSpecificDay(
            hourlyData,
            new Date(weatherWidget.sunrise).getDay(),
          ),
          description: addDescToHourlyDataForSpecificDay(
            hourlyData,
            wmo,
            new Date(weatherWidget.sunrise).getDay(),
          ),
          image: addImageToHourlyDataForSpecificDay(
            hourlyData,
            wmo,
            new Date(weatherWidget.sunrise).getDay(),
          ),
        },
      };
      return weatherWidgetFull;
    },
  );

  return weatherWidgetFull;
};
