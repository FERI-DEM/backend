import { CreateCalibrationDto } from '../dto';

export class Calibration extends CreateCalibrationDto {
  radiation: number;
  date: string;
}
