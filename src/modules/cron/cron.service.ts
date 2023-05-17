import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PowerPlantsService } from '../power-plants/power-plants.service';

@Injectable()
export class CronService {
  constructor(private readonly service: PowerPlantsService) {}

  @Cron('* */15 * * * *')
  async collectPowerPlantData() {
    try {
      await this.service.saveHistoricalData();
      Logger.log('Cron job ran successfully', 'CronService');
    } catch (e) {
      Logger.error(e);
    }
  }
}
