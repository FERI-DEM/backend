import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PowerPlantsService } from './power-plants.service';
import {
  CreateCalibrationDto,
  CreatePowerPlantDto,
  UpdatePowerPlantDto,
} from './dto';
import { AuthGuard, RoleGuard } from '../auth/guards';
import { Roles, User } from '../../common/decorators';
import { Role } from '../../common/types';

@ApiTags('power-plants')
@ApiBearerAuth()
@UseGuards(AuthGuard, RoleGuard)
@Controller('power-plants')
export class PowerPlantsController {
  constructor(private readonly powerPlantService: PowerPlantsService) {}

  @Post()
  async create(@Body() dto: CreatePowerPlantDto, @User('id') userId: string) {
    return await this.powerPlantService.create(userId, dto);
  }

  @Roles(Role.POWER_PLANT_OWNER)
  @Get(':id')
  async find(@Param('id') powerPlantId: string, @User('id') userId: string) {
    return await this.powerPlantService.findById(userId, powerPlantId);
  }

  @Roles(Role.POWER_PLANT_OWNER)
  @Patch(':id')
  async update(
    @Param('id') powerPlantId: string,
    @Body() dto: UpdatePowerPlantDto,
    @User('id') userId: string,
  ) {
    return await this.powerPlantService.update(userId, powerPlantId, dto);
  }

  @Roles(Role.POWER_PLANT_OWNER)
  @Get('predict/:id')
  async predict(@Param('id') powerPlantId: string, @User('id') userId: string) {
    return await this.powerPlantService.predict(userId, powerPlantId);
  }

  @Roles(Role.POWER_PLANT_OWNER)
  @Post('calibrate/:id')
  async calibrate(
    @Param('id') powerPlantId: string,
    @Body() dto: CreateCalibrationDto,
    @User('id') userId: string,
  ) {
    return await this.powerPlantService.calibrate(userId, powerPlantId, dto);
  }

  @Roles(Role.POWER_PLANT_OWNER)
  @Get()
  async findAll(@User('id') userId: string) {
    return await this.powerPlantService.findByUser(userId);
  }
}