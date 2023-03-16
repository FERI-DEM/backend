import { Injectable } from '@nestjs/common';
import { PowerPlantRepository } from './repository/power-plant.repository';

@Injectable()
export class PowerPlantsService {
  constructor(private readonly powerPlantRepository: PowerPlantRepository) {}
}
