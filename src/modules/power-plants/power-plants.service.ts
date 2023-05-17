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
import { PowerPlant } from './schemas/power-plant.schema';
import { UsersService } from '../users/users.service';
import { Role } from '../../common/types';
import { Client } from 'cassandra-driver';
import { CASSANDRA_CLIENT } from '../../common/modules';
import { getHistoricalDataById } from './utils/cassandra-queries';
import { FirebaseService } from '../../common/services';
import { OpenMeteoAPI } from '../forecasts/strategies/open-meteo.strategy';

// TODO: maybe user can change calibration if he enters wrong number

@Injectable()
export class PowerPlantsService {
  constructor(
    private readonly powerPlantRepository: PowerPlantRepository,
    private readonly forecastService: OpenMeteoAPI,
    private readonly userService: UsersService,
    private readonly firebase: FirebaseService,
    @Inject(CASSANDRA_CLIENT) private readonly cassandraClient: Client,
  ) {}

  async create(userId: string, uid: string, data: CreatePowerPlantDto) {
    const calibrationValue = data.maxPower / (0.2 * data.size);

    const result = await this.powerPlantRepository.createPowerPlant(userId, {
      ...data,
      calibration: [
        { date: new Date().toISOString(), value: calibrationValue },
      ],
    });
    const newPowerPlant = result.powerPlants.find(
      (powerPlant) => powerPlant.displayName === data.displayName,
    );

    if (!newPowerPlant) {
      throw new HttpException(
        'Could not create power plant',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (result.powerPlants.length === 1) {
      await this.userService.addRole(userId, Role.POWER_PLANT_OWNER);
    }

    this.firebase.auth.setCustomUserClaims(uid, {
      valid: true,
    });
    return newPowerPlant;
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

    const forecast = await this.forecastService.getCurrentSolarRadiation(
      latitude,
      longitude,
    );

    const { solar } = forecast;

    if (solar <= 0) {
      throw new HttpException(
        'Please calibrate when solar radiation is greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    // TODO: who decides the date frontend or backend?
    return await this.powerPlantRepository.createCalibration(
      userId,
      powerPlantId,
      {
        date: new Date().toISOString(),
        value: data.power / solar,
      },
    );
  }

  async predictByDays(userId: string, powerPlantId: string) {
    const predictions = await this.predict(userId, powerPlantId);
    const sumByDay = predictions.reduce(
      (acc, curr) => {
        const date = new Date(curr.date);
        if (date.getDay() !== acc.currentDay) {
          acc.result.push(0);
          acc.currentDay = date.getDay();
        }

        acc.result[acc.result.length - 1] += curr.power;
        return acc;
      },
      { result: [], currentDay: -1 },
    );

    return sumByDay.result;
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

    // get weather forecast for next 7 days
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 7);

    const forecasts = await this.forecastService.getSolarRadiationForecast(
      latitude,
      longitude,
    );

    if (!forecasts) {
      throw new HttpException(
        'Could not retrieve data for forecasts',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    // TODO: last calibration or average
    // const { power, radiation } = calibration[calibration.length - 1];
    //
    // if (radiation <= 0) {
    //   throw new HttpException(
    //     'Radiation can not be 0 or lower',
    //     HttpStatus.PRECONDITION_FAILED,
    //   );
    // }
    //
    // if (power <= 0) {
    //   throw new HttpException(
    //     'Power can not be 0 or lower',
    //     HttpStatus.PRECONDITION_FAILED,
    //   );
    // }

    const coefficient = calibration[calibration.length - 1].value;

    if (coefficient <= 0) {
      throw new HttpException(
        'Coefficient can not be 0 or lower',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    // predicted values for 7 day
    return forecasts.map((f) => {
      const predictedPower = f.solar * coefficient;
      return {
        date: f.timestamp,
        power: predictedPower,
      };
    });
  }
}
