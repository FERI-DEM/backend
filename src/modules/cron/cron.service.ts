import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PowerPlantsService } from '../power-plants/power-plants.service';
import { retryOnFailure } from './utils';

@Injectable()
export class CronService {
  constructor(private readonly service: PowerPlantsService) {}

  @Cron('* */15 * * * *')
  async collectPowerPlantData() {
    await retryOnFailure<void>(
      async () => await this.service.saveHistoricalData(),
      3,
      (e) => Logger.error(e.message, 'CronService'),
    );
    Logger.log('Cron job ran successfully', 'CronService');
  }
}
