import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiHeader } from '@nestjs/swagger';
import { PowerPlantsService } from './power-plants.service';
import {
  CreateCalibrationDto,
  CreatePowerPlantDto,
  UpdatePowerPlantDto,
} from './dto';
import { AuthGuard, RoleGuard } from '../auth/guards';
import { Roles, User } from '../../common/decorators';
import { Role } from '../../common/types';
import { Statistics } from './types';

@ApiTags('power-plants')
@ApiBearerAuth()
@UseGuards(AuthGuard, RoleGuard)
@Controller('power-plants')
export class PowerPlantsController {
  constructor(private readonly powerPlantService: PowerPlantsService) {}

  @Roles(Role.POWER_PLANT_OWNER)
  @Get('history')
  async history(
    @Query('powerPlantIds') powerPlantIds: string[],
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return await this.powerPlantService.history(
      powerPlantIds,
      dateFrom,
      dateTo,
    );
  }

  @Roles(Role.POWER_PLANT_OWNER)
  @Get('production-statistics/:id')
  async statistics(
    @User('id') userId: string,
    @Param('id') powerPlantId: string,
    @Query('type') type: Statistics[] | Statistics,
  ) {
    return await this.powerPlantService.getProductionStatistics(
      powerPlantId,
      type,
    );
  }

  @Post()
  async create(
    @Body() dto: CreatePowerPlantDto,
    @User('id') userId: string,
    @User('userId') uid: string,
  ) {
    return await this.powerPlantService.create(userId, uid, dto);
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
  @ApiHeader({
    name: 'TimezoneOffset',
    description: 'Timezone offset in hours',
    required: false,
  })
  async predict(
    @Param('id') powerPlantId: string,
    @User('id') userId: string,
    @Headers('TimezoneOffset') timezoneOffset?: number,
  ) {
    return await this.powerPlantService.predict(powerPlantId, timezoneOffset);
  }

  @Roles(Role.POWER_PLANT_OWNER)
  @Get('predict-by-days/:id')
  async predictByDays(@Param('id') powerPlantId: string) {
    return await this.powerPlantService.predictByDays(powerPlantId);
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

  @Roles(Role.POWER_PLANT_OWNER)
  @Delete(':id')
  async delete(@Param('id') powerPlantId: string, @User('id') userId: string) {
    return await this.powerPlantService.delete(userId, powerPlantId);
  }
}
