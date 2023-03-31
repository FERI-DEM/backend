import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PowerPlantsService } from './power-plants.service';
import {
  UpdatePowerPlantDto,
  CreatePowerPlantDto,
  CreateCalibrationDto,
} from './dto';

@ApiTags('power-plants')
@Controller('power-plants')
export class PowerPlantsController {
  constructor(private readonly powerPlantService: PowerPlantsService) {}

  userId = '64064ccd62bdeec513ad2f0b';

  @Post()
  async create(@Body() dto: CreatePowerPlantDto) {
    return await this.powerPlantService.create(this.userId, dto);
  }

  @Get(':id')
  async find(@Param('id') powerPlantId: string) {
    return await this.powerPlantService.findById(this.userId, powerPlantId);
  }

  @Patch(':id')
  async update(
    @Param('id') powerPlantId: string,
    @Body() dto: UpdatePowerPlantDto,
  ) {
    return await this.powerPlantService.update(this.userId, powerPlantId, dto);
  }

  @Post('predict/:id')
  async predict(@Param('id') powerPlantId: string) {
    return await this.powerPlantService.predict(this.userId, powerPlantId);
  }

  @Post('calibrate/:id')
  async calibrate(
    @Param('id') powerPlantId: string,
    @Body() dto: CreateCalibrationDto,
  ) {
    return await this.powerPlantService.calibrate(
      this.userId,
      powerPlantId,
      dto,
    );
  }

  @Get()
  async findAll() {
    return await this.powerPlantService.findAll(this.userId);
  }
}
