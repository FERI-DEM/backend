import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
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
import {
  getHistoricalData,
  getHistoricalDataById,
  HistoricalData,
  insertHistoricPowerPlantData,
} from './utils/cassandra-queries';
import { FirebaseService } from '../../common/services';
import { OpenMeteoAPI } from '../forecasts/strategies/open-meteo.strategy';
import { Statistics } from './types';
import { getRangeForBefore, getRangeForNow } from './utils/statistics';
import settings from '../../app.settings';
import { Env } from '../../common/constants/env.constants';
import { formatDateTo15minInterval } from '../../common/utils';
import { roundTimeUp } from '../../common/utils';

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

  async saveHistoricalData(): Promise<void> {
    const powerPlants: { _id: string; powerPlants: PowerPlant[] }[] =
      await this.findAll();

    const date = formatDateTo15minInterval(new Date());
    const history = await Promise.all(
      powerPlants
        .map((x) => {
          if (x.powerPlants && x.powerPlants.length > 0) {
            return x.powerPlants.map((y) =>
              getHistoricalData(
                this.cassandraClient,
                [y._id.toString()].flat(),
                date,
                date,
              ),
            );
          }
          return Promise.resolve([]);
        })
        .flat(),
    );

    const arr: HistoricalData[] = [];

    for (const user of powerPlants) {
      for (const powerPlant of user.powerPlants) {
        const { latitude, longitude, _id } = powerPlant;
        const weather = await this.forecastService.getCurrentSolarRadiation(
          latitude,
          longitude,
        );

        let predictedPower = 0;
        if (powerPlant.calibration.length !== 0) {
          const predictions = await this.predict(_id.toString());
          const predictedDate = new Date(weather.timestamp);
          predictedDate.setMinutes(predictedDate.getMinutes() + 15);
          predictedPower = predictions.find(
            (p) => new Date(p.date).getTime() === predictedDate.getTime(),
          )?.power;
        }

        // check if in array is powerPlantId and timestamp already
        const isInDBHistory = (history?.flat() ?? [])?.some(
          (a) =>
            a.powerPlantId === _id.toString() &&
            a.timestamp === new Date(weather.timestamp).getTime(),
        );
        const isInCurrentHistory = arr?.some(
          (a) =>
            a.powerPlantId === _id.toString() &&
            a.timestamp === new Date(weather.timestamp).getTime(),
        );

        if (!isInDBHistory && !isInCurrentHistory) {
          arr.push({
            powerPlantId: _id.toString(),
            solar: weather.solar,
            power: 0,
            predictedPower: predictedPower,
            timestamp: new Date(weather.timestamp).getTime(),
          });
        }
      }
    }
    if (settings.environment === Env.PRODUCTION) {
      await insertHistoricPowerPlantData(this.cassandraClient, arr);
    } else {
      Logger.log(arr, 'Historical data');
    }
  }

  async getProductionStatistics(
    powerPlantId: string,
    type: Statistics | Statistics[],
  ) {
    const getStatistics = async (type: Statistics) => {
      const graterThanTimestamp = getRangeForNow(type);

      const historicalData = await getHistoricalDataById(
        this.cassandraClient,
        powerPlantId,
        graterThanTimestamp,
        Date.now(),
      );

      // power production for this timestamp on
      let now = 0;
      for (let i = 0; i < historicalData.length; i++) {
        now += historicalData[i].predictedPower;
      }

      //
      const beforeDate = getRangeForBefore(type);
      const historicalDataBefore = await getHistoricalDataById(
        this.cassandraClient,
        powerPlantId,
        beforeDate,
        graterThanTimestamp,
      );

      let before = 0;
      for (let i = 0; i < historicalDataBefore.length; i++) {
        before += historicalDataBefore[i].predictedPower;
      }

      return {
        now,
        before,
        type,
      };
    };

    if (typeof type === 'string') {
      return getStatistics(type);
    } else {
      return Promise.all(type.map((t) => getStatistics(t)));
    }
  }

  async create(userId: string, uid: string, data: CreatePowerPlantDto) {
    const result = await this.powerPlantRepository.createPowerPlant(userId, {
      ...data,
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

    await this.firebase.auth.setCustomUserClaims(uid, {
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

  async history(powerPlantIds: string[], dateFrom?: string, dateTo?: string) {
    return await getHistoricalData(
      this.cassandraClient,
      [powerPlantIds].flat(),
      dateFrom ? new Date(dateFrom) : new Date(0),
      dateTo ? new Date(dateTo) : new Date(),
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

  async predictByDays(powerPlantId: string): Promise<number[]> {
    const predictions = await this.predict(powerPlantId);

    const sumByDay = predictions.reduce(
      (acc, curr) => {
        const date = new Date(curr.date);
        if (date.getDay() !== acc.currentDay) {
          acc.result.push(0);
          acc.currentDay = date.getDay();
        }

        acc.result[acc.result.length - 1] += curr.power * 0.25;
        return acc;
      },
      { result: [], currentDay: -1 },
    );

    return sumByDay.result;
  }

  async predict(
    powerPlantId: string,
    timezoneOffset = 0,
  ): Promise<{ date: string; power: number }[]> {
    const { powerPlants } = await this.powerPlantRepository.findById(
      powerPlantId,
    );

    if (powerPlants.length < 1) {
      throw new HttpException(
        'No power plant found',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const { calibration, latitude, longitude }: PowerPlant = powerPlants[0];

    if (calibration.length < 1) {
      throw new HttpException(
        'No calibration data',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

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
    const coefficient = calibration[calibration.length - 1].value;

    if (coefficient <= 0) {
      throw new HttpException(
        'Coefficient can not be 0 or lower',
        HttpStatus.PRECONDITION_FAILED,
      );
    }
    const roundedDate = roundTimeUp(new Date(Date.now()), 15);
    const roundedTimestamp = new Date(roundedDate.toISOString()).getTime();

    return forecasts.flatMap((f) => {
      const timestamp = new Date(f.timestamp).getTime();
      if (timestamp < roundedTimestamp) return [];
      const predictedPower = f.solar * coefficient;
      const date = new Date(
        timestamp + timezoneOffset * 60 * 60 * 1000,
      ).toISOString();
      return [
        {
          date: date,
          power: predictedPower,
        },
      ];
    });
  }

  private async findAll() {
    return await this.powerPlantRepository.findAll();
  }

  async getProduction(powerPlantId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const historicalData = await this.history(
      [powerPlantId],
      startOfMonth.toISOString(),
      endOfMonth.toISOString(),
    );

    let productionThisMonth = 0;
    for (let i = 0; i < historicalData.length; i++) {
      productionThisMonth += historicalData[i].predictedPower;
    }

    const powerPlant = await this.powerPlantRepository.findById(powerPlantId);

    return {
      from: startOfMonth,
      to: endOfMonth,
      powerPlantId: powerPlantId,
      email: powerPlant.email,
      production: productionThisMonth,
    };
  }

  async getCurrentProduction(powerPlantId: string, timezoneOffset = 0) {
    const currTime = formatDateTo15minInterval(new Date());
    const powerPlant = await this.powerPlantRepository.findById(powerPlantId);
    const predictions = await this.predict(powerPlantId, timezoneOffset);
    const currPrediction = predictions.find(
      (p) => p.date === currTime.toISOString(),
    );

    if (!currPrediction) {
      return {
        email: powerPlant.email,
        userId: powerPlant._id,
        powerPlantId: powerPlant.powerPlants[0]._id,
        displayName: powerPlant.powerPlants[0].displayName,
        production: predictions[0],
      };
    }

    return {
      email: powerPlant.email,
      userId: powerPlant._id,
      powerPlantId: powerPlant.powerPlants[0]._id,
      displayName: powerPlant.powerPlants[0].displayName,
      production: currPrediction,
    };
  }
}
