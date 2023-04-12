import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AddMemberDto, CreateCommunityDto } from './dto';
import { CommunitiesService } from './communities.service';
import { Roles, User } from '../../common/decorators';
import { AuthGuard, RoleGuard } from '../auth/guards';
import { Role } from '../../common/types';

@ApiTags('communities')
@ApiBearerAuth()
@UseGuards(AuthGuard, RoleGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

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
}
