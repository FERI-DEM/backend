import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateCommunityDto,
  RequestToJoinDto,
  UpdateCommunityDto,
} from './dto';
import { CommunitiesService } from './communities.service';
import { Roles, User } from '../../common/decorators';
import { AuthGuard, RoleGuard } from '../auth/guards';
import { RequestUser, Role } from '../../common/types';
import { ProcessRequestDto } from './dto/process-request.dto';
import { Statistics } from '../power-plants/types';

@ApiTags('communities')
@ApiBearerAuth()
@UseGuards(AuthGuard, RoleGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Roles(Role.COMMUNITY_ADMIN)
  @Patch('process-request')
  async processRequest(
    @User('id') adminId: string,
    @Body() dto: ProcessRequestDto,
  ) {
    return await this.communitiesService.processRequest({ ...dto, adminId });
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get('statistics/:id')
  async getStatistics(
    @Param('id') id: string,
    @Query('type') type: Statistics,
  ) {
    return await this.communitiesService.productionStatistics(id, type);
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get()
  async findCommunityByUser(@User('id') userId: string) {
    return await this.communitiesService.findByUser(userId);
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.communitiesService.findById(id);
  }

  @Roles(Role.COMMUNITY_ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityDto) {
    return await this.communitiesService.update(id, dto);
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get(':id/members-power-share')
  async getMembersPowerShare(@Param('id') id: string) {
    return await this.communitiesService.getMembersPowerShare(id);
  }

  @Roles(Role.POWER_PLANT_OWNER)
  @Post()
  async create(@Body() dto: CreateCommunityDto, @User('id') adminId: string) {
    return await this.communitiesService.create({ ...dto, adminId });
  }

  @Roles(Role.COMMUNITY_ADMIN)
  @Delete('remove/:communityId/:memberId')
  async removePowerPlants(
    @Param('memberId') memberId: string,
    @Param('communityId') communityId: string,
    @User('id') adminId: string,
    @Body() dto: { powerPlantIds: string[] },
  ) {
    return await this.communitiesService.removePowerPlants(
      dto.powerPlantIds,
      memberId,
      communityId,
      adminId,
    );
  }

  @Roles(Role.COMMUNITY_ADMIN)
  @Delete(':communityId')
  async delete(
    @Param('communityId') communityId: string,
    @User('id') adminId: string,
  ) {
    return await this.communitiesService.delete(communityId, adminId);
  }

  @Get('search')
  @ApiQuery({ name: 'name', required: true })
  async search(@Query('name') name: string) {
    return await this.communitiesService.findByName(name);
  }

  @Roles(Role.COMMUNITY_MEMBER)
  @Delete('leave/:communityId')
  async leave(
    @Param('communityId') communityId: string,
    @User('id') userId: string,
    @Body() dto: { powerPlantIds: string[] },
  ) {
    return await this.communitiesService.leave(
      dto.powerPlantIds,
      userId,
      communityId,
    );
  }

  @Post('request-to-join')
  async requestToJoin(
    @User() user: RequestUser,
    @Body() dto: RequestToJoinDto,
  ) {
    return await this.communitiesService.requestToJoin({ ...dto, user });
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get('power-production/:id')
  async getCommunityPowerProduction(@Param('id') id: string) {
    return await this.communitiesService.getCommunityPowerProduction(id);
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get('predict-power-production/:id')
  @ApiHeader({
    name: 'TimezoneOffset',
    description: 'Timezone offset in hours',
    required: false,
  })
  async getCommunityPredictPowerProduction(
    @Param('id') id: string,
    @Headers('TimezoneOffset') timezoneOffset?: number,
  ) {
    return await this.communitiesService.predict(id, timezoneOffset);
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get('predict-by-days/:id')
  async getCommunityPredictByDays(@Param('id') id: string) {
    return await this.communitiesService.predictByDays(id);
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get('current-production/:id')
  async getCurrentProduction(@Param('id') id: string) {
    return await this.communitiesService.getCurrentProduction(id);
  }

  @Roles(Role.COMMUNITY_MEMBER, Role.COMMUNITY_ADMIN)
  @Get('history/:id')
  async getHistory(
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return await this.communitiesService.getHistory(id, dateFrom, dateTo);
  }
}
