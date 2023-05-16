import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { PowerPlantsModule } from '../power-plants/power-plants.module';

@Module({
  imports: [PowerPlantsModule],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
