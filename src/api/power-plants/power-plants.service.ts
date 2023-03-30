import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PowerPlantRepository } from './repository/power-plant.repository';
import {
  CreateCalibrationDto,
  CreatePowerPlantDto,
  UpdatePowerPlantDto,
} from './dto';
import { ForecastsService } from '../forecasts/forecasts.service';
import { roundUpDate } from '../../common/utils';
import { PowerPlant } from './schemas/power-plant.schema';

@Injectable()
export class PowerPlantsService {
  constructor(
    private readonly powerPlantRepository: PowerPlantRepository,
    private readonly forecastService: ForecastsService,
  ) {}

  async create(userId: string, data: CreatePowerPlantDto) {
    // TODO: add role to user
    return await this.powerPlantRepository.createPowerPlant(userId, data);
  }

  async delete(userId: string, powerPlantId: string) {
    return await this.powerPlantRepository.deletePowerPlant(
      userId,
      powerPlantId,
    );
  }

  async findOne(userId: string, powerPlantId: string) {
    const powerPlant = await this.powerPlantRepository.findPowerPlantById(
      userId,
      powerPlantId,
    );

    if (!powerPlant) {
      throw new NotFoundException('Power plant not found');
    }
    return powerPlant;
  }

  async findAll(userId: string) {
    return await this.powerPlantRepository.findPowerPlantByUserId(userId);
  }

  async update(
    userId: string,
    powerPlantId: string,
    data: UpdatePowerPlantDto,
  ) {
    return await this.powerPlantRepository.updatePowerPlant(
      userId,
      powerPlantId,
      data,
    );
  }

  async calibrate(
    userId: string,
    powerPlantId: string,
    data: CreateCalibrationDto,
  ) {
    const found = await this.findOne(userId, powerPlantId);
    const latitude = found.powerPlants[0].latitude;
    const longitude = found.powerPlants[0].longitude;

    const { forecasts } = await this.forecastService.getSolarRadiation({
      lat: latitude,
      lon: longitude,
    });

    const date = roundUpDate(new Date().toISOString());

    const { ghi } = forecasts.find(
      (f) => f.period_end.split('.')[0] === date.split('.')[0],
    );

    if (ghi <= 0) {
      throw new HttpException(
        'Please calibrate when there is sun',
        HttpStatus.BAD_REQUEST,
      );
    }

    // TODO: who decides the date frontend or backend?
    return await this.powerPlantRepository.createCalibration(
      userId,
      powerPlantId,
      {
        ...data,
        date: new Date().toISOString(),
        radiation: ghi,
      },
    );
  }

  async predict(
    userId: string,
    powerPlantId: string,
  ): Promise<{ date: string; power: number }[]> {
    const { powerPlants } = await this.findOne(userId, powerPlantId);
    const { calibration, latitude, longitude }: PowerPlant = powerPlants[0];

    if (calibration.length < 1) {
      throw new HttpException(
        'No calibration data',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const { forecasts } = await this.forecastService.getSolarRadiation({
      lat: latitude,
      lon: longitude,
    });

    if (!forecasts) {
      throw new HttpException(
        'Could not retrieve data for forecasts',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    // TODO: last calibration or average
    const { power, radiation } = calibration[calibration.length - 1];
    // Prediction for next 30 min

    if (radiation <= 0) {
      throw new HttpException(
        'Radiation can not be 0 or lower',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    if (power <= 0) {
      throw new HttpException(
        'Power can not be 0 or lower',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const coefficient = power / radiation;

    if (coefficient <= 0) {
      throw new HttpException(
        'Coefficient can not be 0 or lower',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    // predicted values for 7 days
    const predictedValues = forecasts.map((f) => {
      const predictedPower = f.ghi * coefficient;
      return {
        date: f.period_end,
        power: predictedPower,
      };
    });

    await this.powerPlantRepository.savePredictedProduction(
      userId,
      powerPlantId,
      predictedValues,
    );
    return predictedValues;
  }
}
