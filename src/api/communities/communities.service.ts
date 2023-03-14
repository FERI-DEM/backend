import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCommunityDto } from './dto';
import { UsersService } from '../users/users.service';
import { Role } from '../../common/types';
import { CommunityRepository } from './repository/community.repository';

@Injectable()
export class CommunitiesService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly usersService: UsersService,
  ) {}

  async findCommunityByUser(userId: string) {
    //TODO: should return array of communities
    const org = await this.communityRepository.find({
      membersIds: { $in: [userId] },
    });
    if (!org) {
      throw new HttpException('Organization not found', HttpStatus.NOT_FOUND);
    }
    return org;
  }

  async create(data: CreateCommunityDto & { adminId: string }) {
    // TODO: use transaction
    const org = await this.communityRepository.create({
      ...data,
      membersIds: [data.adminId],
    });
    if (!org)
      throw new HttpException(
        'Organization not created',
        HttpStatus.BAD_REQUEST,
      );
    await this.usersService.changeRole(data.adminId, Role.ORGANIZATION_ADMIN);
    return org;
  }

  async addMember(memberId: string, organizationId: string) {
    // TODO: add validation if member already in organization and if it is called by admin
    return await this.communityRepository.findOneAndUpdate(
      { _id: organizationId },
      { $push: { membersIds: memberId } },
    );
  }

  async removeMember(memberId: string, organizationId: string) {
    // TODO: add validation, admin cant remove himself
    return await this.communityRepository.findOneAndUpdate(
      { _id: organizationId },
      { $pull: { membersIds: memberId } },
    );
  }

  async delete(organizationId: string, adminId: string): Promise<boolean> {
    // TODO: add validation
    const deleted = await this.communityRepository.findOneAndDelete({
      _id: organizationId,
    });
    if (!deleted) {
      throw new HttpException(
        'Organization not deleted',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.usersService.changeRole(adminId, Role.POWER_PLANT_OWNER);
    return !!deleted;
  }
}
