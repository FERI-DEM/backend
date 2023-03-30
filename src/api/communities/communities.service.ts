import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommunityDto } from './dto';
import { UsersService } from '../users/users.service';
import { Role } from '../../common/types';
import { CommunityRepository } from './repository/community.repository';
import { CommunityDocument } from './schemas/community.schema';

@Injectable()
export class CommunitiesService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly usersService: UsersService,
  ) {}

  // TODO: a lot of checks could be replaced by role decorator
  // check if admin can add/delete member to/from community
  private async validate(
    memberId: string,
    communityId: string,
    adminId: string,
  ): Promise<boolean> {
    // check if function caller is admin of this community
    const community = await this.communityRepository.findOne({
      _id: communityId,
      adminId,
    });

    if (!community) {
      throw new HttpException(
        'You are not admin of this community',
        HttpStatus.BAD_REQUEST,
      );
    }

    // check if member exists
    const member = await this.usersService.findById(memberId);
    if (!member) {
      return false;
    }

    return true;
  }

  async findCommunityByUser(userId: string): Promise<CommunityDocument> {
    //TODO: how many communities can user have?
    const org = await this.communityRepository.find({
      membersIds: { $in: [userId] },
    });
    if (!org) {
      throw new NotFoundException('Community not found');
    }
    return org;
  }

  async create(
    data: CreateCommunityDto & { adminId: string },
  ): Promise<CommunityDocument> {
    // TODO: how many communities can user create?
    const org = await this.communityRepository.create({
      ...data,
      membersIds: [data.adminId],
    });
    if (!org)
      throw new HttpException(
        'Cloud not create community',
        HttpStatus.BAD_REQUEST,
      );
    await this.usersService.changeRole(data.adminId, Role.COMMUNITY_ADMIN);
    return org;
  }

  async addMember(
    memberId: string,
    communityId: string,
    adminId: string,
  ): Promise<boolean> {
    const isValid = await this.validate(memberId, communityId, adminId);

    if (!isValid) {
      throw new HttpException(
        'You can not add member to this community',
        HttpStatus.BAD_REQUEST,
      );
    }
    // check if member already in this community
    const found = await this.communityRepository.findOne({
      _id: communityId,
      membersIds: { $in: [memberId] },
    });

    if (found) {
      throw new HttpException(
        'Member already in community',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.communityRepository.findOneAndUpdate(
      { _id: communityId },
      { $push: { membersIds: memberId } },
    );

    await this.usersService.changeRole(memberId, Role.COMMUNITY_MEMBER);

    return true;
  }

  async removeMember(
    memberId: string,
    communityId: string,
    adminId: string,
  ): Promise<boolean> {
    if (adminId === memberId) {
      throw new HttpException(
        'Admin can not remove himself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValid = await this.validate(memberId, communityId, adminId);

    if (!isValid) {
      throw new HttpException(
        'You can not remove member from this community',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.communityRepository.findOneAndUpdate(
      { _id: communityId },
      { $pull: { membersIds: memberId } },
    );

    await this.usersService.changeRole(memberId, Role.POWER_PLANT_OWNER);

    return true;
  }

  async delete(communityId: string, adminId: string): Promise<boolean> {
    const deleted = await this.communityRepository.findOneAndDelete({
      _id: communityId,
      adminId,
    });
    if (!deleted) {
      throw new NotFoundException('Community not found');
    }
    await this.usersService.changeRole(adminId, Role.POWER_PLANT_OWNER);
    return !!deleted;
  }

  async leave(memberId: string, communityId: string): Promise<boolean> {
    const member = await this.usersService.findById(memberId);
    // do we even need this check?
    if (!member) {
      return false;
    }

    const community = await this.communityRepository.findOne({
      _id: communityId,
      membersIds: { $in: [memberId] },
    });

    if (!community) {
      throw new HttpException(
        'You are not member of this community',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (community.adminId === memberId) {
      throw new HttpException(
        'Admin can not leave community',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.communityRepository.findOneAndUpdate(
      { _id: communityId },
      { $pull: { membersIds: memberId } },
    );

    await this.usersService.changeRole(memberId, Role.POWER_PLANT_OWNER);

    return true;
  }
}
