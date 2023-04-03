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
import { UsersService } from '../users/users.service';
import { Role } from '../../common/types';

@Injectable()
export class PowerPlantsService {
  constructor(
    private readonly powerPlantRepository: PowerPlantRepository,
    private readonly forecastService: ForecastsService,
    private readonly userService: UsersService,
  ) {}

  async create(userId: string, data: CreatePowerPlantDto) {
    const result = await this.powerPlantRepository.createPowerPlant(
      userId,
      data,
    );

    if (!result) {
      throw new HttpException(
        'Could not create power plant',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (result.powerPlants.length === 1) {
      await this.userService.changeRole(userId, Role.POWER_PLANT_OWNER);
    }

    return result;
  }

  async delete(userId: string, powerPlantId: string) {
    const result = await this.powerPlantRepository.deletePowerPlant(
      userId,
      powerPlantId,
    );
    if (!result) {
      throw new HttpException(
        'Could not delete power plant',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (result.powerPlants.length === 0) {
      await this.userService.changeRole(userId, Role.BASIC_USER);
    }

    return result;
  }

  async findById(userId: string, powerPlantId: string) {
    const powerPlant = await this.powerPlantRepository.findPowerPlantById(
      userId,
      powerPlantId,
    );

    if (!powerPlant) {
      throw new NotFoundException('Power plant not found');
    }
    return powerPlant;
  }

  async findByUser(userId: string) {
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
    const found = await this.findById(userId, powerPlantId);
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
    const { powerPlants } = await this.findById(userId, powerPlantId);
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
