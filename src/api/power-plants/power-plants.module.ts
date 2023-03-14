import { Module } from '@nestjs/common';
import { PowerPlantsController } from './power-plants.controller';
import { PowerPlantsService } from './power-plants.service';

@Module({
  controllers: [PowerPlantsController],
  providers: [PowerPlantsService],
})
export class PowerPlantsModule {}
