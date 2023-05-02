import {
  HttpException,
  HttpStatus,
  Inject,
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
import { Client } from 'cassandra-driver';
import { CASSANDRA_CLIENT } from '../../common/modules';
import { getHistoricalDataById } from './utils/cassandra-queries';

// TODO: maybe user can change calibration if he enters wrong number

@Injectable()
export class PowerPlantsService {
  constructor(
    private readonly powerPlantRepository: PowerPlantRepository,
    private readonly forecastService: ForecastsService,
    private readonly userService: UsersService,
    @Inject(CASSANDRA_CLIENT) private readonly cassandraClient: Client,
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
      await this.userService.addRole(userId, Role.POWER_PLANT_OWNER);
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
      await this.userService.removeRole(userId, Role.POWER_PLANT_OWNER);
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

  async findPowerPlantWithHistoricData(userId: string, powerPlantId: string) {
    const powerPlant = await this.powerPlantRepository.findPowerPlantById(
      userId,
      powerPlantId,
    );

    if (!powerPlant) {
      throw new NotFoundException('Power plant not found');
    }

    const history = await getHistoricalDataById(
      this.cassandraClient,
      powerPlantId,
    );

    return { ...powerPlant.toObject(), history };
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
    if (data.power <= 0) {
      throw new HttpException(
        'Power must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    const found = await this.findById(userId, powerPlantId);
    const latitude = found.powerPlants[0].latitude;
    const longitude = found.powerPlants[0].longitude;

    const { forecasts } = await this.forecastService.getSolarRadiation({
      lat: latitude,
      lon: longitude,
    });

    if (!forecasts) {
      throw new HttpException(
        'Could not get solar radiation',
        HttpStatus.BAD_REQUEST,
      );
    }

    // TODO: maybe we should round up to the nearest hour
    const date = roundUpDate(new Date().toISOString());

    const forecast = forecasts.find(
      (f) => f.period_end.split('.')[0] === date.split('.')[0],
    );

    if (!forecast) {
      throw new HttpException(
        'Current hour is not in the forecast',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { ghi } = forecast;

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
    return forecasts.map((f) => {
      const predictedPower = f.ghi * coefficient;
      return {
        date: f.period_end,
        power: predictedPower,
      };
    });
  }
}
