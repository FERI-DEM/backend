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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AddMemberDto, CreateCommunityDto, RequestToJoinDto } from './dto';
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
  @Patch('invite/:communityId')
  async addMember(
    @Body() { email }: AddMemberDto,
    @Param('communityId') communityId: string,
    @User('id') adminId: string,
  ) {
    return await this.communitiesService.addMember(email, communityId, adminId);
  }

  @Roles(Role.COMMUNITY_ADMIN)
  @Delete('remove/:communityId/:memberId')
  async deleteMember(
    @Param('memberId') memberId: string,
    @Param('communityId') communityId: string,
    @User('id') adminId: string,
  ) {
    return await this.communitiesService.removeMember(
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

  @Roles(Role.COMMUNITY_MEMBER)
  @Delete('leave/:communityId')
  async leave(
    @Param('communityId') communityId: string,
    @User('id') userId: string,
  ) {
    return await this.communitiesService.leave(userId, communityId);
  }

  @Post('request-to-join')
  async requestToJoin(
    @User() user: RequestUser,
    @Body() dto: RequestToJoinDto,
  ) {
    return await this.communitiesService.requestToJoin({ ...dto, user });
  }

  @Roles(Role.COMMUNITY_ADMIN)
  @Patch('process-request')
  async processRequest(
    @User('id') adminId: string,
    @Body() dto: ProcessRequestDto,
  ) {
    return await this.communitiesService.processRequest({ ...dto, adminId });
  }
}
