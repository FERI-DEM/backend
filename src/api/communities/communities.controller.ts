import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AddMemberDto, CreateCommunityDto } from './dto';
import { CommunitiesService } from './communities.service';
import { User } from '@/common/decorators';

@ApiTags('communities')
@ApiBearerAuth()
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  async findOrganizationByUser(@User('id') userId: string) {
    return await this.communitiesService.findCommunityByUser(userId);
  }

  @Post()
  async create(@Body() dto: CreateCommunityDto, @User('id') adminId: string) {
    return await this.communitiesService.create({ ...dto, adminId });
  }

  @Patch('invite/:communityId')
  async addMember(
    @Body() { memberId }: AddMemberDto,
    @Param('communityId') communityId: string,
    @User('id') adminId: string,
  ) {
    return await this.communitiesService.addMember(
      memberId,
      communityId,
      adminId,
    );
  }

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

  @Delete(':communityId')
  async delete(
    @Param('communityId') communityId: string,
    @User('id') adminId: string,
  ) {
    return await this.communitiesService.delete(communityId, adminId);
  }

  @Delete('leave/:communityId')
  async leave(
    @Param('communityId') communityId: string,
    @User('id') userId: string,
  ) {
    return await this.communitiesService.leave(userId, communityId);
  }
}
