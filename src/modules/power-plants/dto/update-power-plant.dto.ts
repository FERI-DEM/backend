import { PartialType } from '@nestjs/swagger';
import { CreatePowerPlantDto } from './create-power-plant.dto';

export class UpdatePowerPlantDto extends PartialType(CreatePowerPlantDto) {}
