import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('power-plants')
@Controller('power-plants')
export class PowerPlantsController {
  @Get(':id')
  async find() {
    return 'find';
  }

  @Post('predict')
  async predict() {
    return 'Predict';
  }

  @Post('calibrate')
  async update() {
    return 'calibrate';
  }

  @Post()
  async create() {
    return 'predict';
  }
}
