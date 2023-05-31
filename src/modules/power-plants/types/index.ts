export type Calibration = {
  value: number;
  date: string;
};

export type CreatePowerPlantWithCalibration = {
  displayName: string;
  latitude: number;
  longitude: number;
  calibration: Calibration[];
};

export enum Statistics {
  today = 'today',
  tomorrow = 'tomorrow',
  week = 'week',
  month = 'month',
  year = 'year',
}
