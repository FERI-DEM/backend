import {
  BadRequestException,
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

  async isMemberOfAdminsCommunity(
    memberId: string,
    communityId: string,
    adminId: string,
  ): Promise<boolean> {
    const community = await this.communityRepository.findOne({
      _id: communityId,
      adminId,
      membersIds: { $in: [memberId] },
    });

    return !!community;
  }

  async isCommunityAdmin(
    communityId: string,
    adminId: string,
  ): Promise<boolean> {
    const community = await this.communityRepository.findOne({
      _id: communityId,
      adminId,
    });

    return !!community;
  }

  async findByUser(userId: string): Promise<CommunityDocument[]> {
    try {
      return await this.communityRepository.findAll({
        membersIds: { $in: [userId] },
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async findById(id: string): Promise<CommunityDocument> {
    const community = await this.communityRepository.findById(id);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  async create(
    data: CreateCommunityDto & { adminId: string },
  ): Promise<CommunityDocument> {
    const members = data.powerPlants.map(
      ({ powerPlantId, powerPlantName }) => ({
        powerPlantId: powerPlantId,
        userId: data.adminId,
        powerPlantName: powerPlantName,
      }),
    );

    const org = await this.communityRepository.create({
      ...data,
      members,
      membersIds: [data.adminId],
    });
    if (!org)
      throw new HttpException(
        'Cloud not create community',
        HttpStatus.BAD_REQUEST,
      );
    await this.usersService.addRole(data.adminId, Role.COMMUNITY_ADMIN);
    return org;
  }

  async addMember(
    email: string,
    communityId: string,
    adminId: string,
  ): Promise<boolean> {
    const isAdmin = await this.isCommunityAdmin(communityId, adminId);

    if (!isAdmin) {
      throw new HttpException(
        'You can not add member to this community',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const member = await this.usersService.findByEmail(email);
    if (!member) {
      throw new HttpException('Member not found', HttpStatus.BAD_REQUEST);
    }

    const memberId = member._id;

    // check if member already in this community
    const community = await this.communityRepository.findOne({
      _id: communityId,
      membersIds: { $in: [memberId] },
    });

    if (community) {
      throw new HttpException(
        'Member already in community',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.communityRepository.findOneAndUpdate(
      { _id: communityId },
      { $push: { membersIds: memberId } },
    );

    await this.usersService.addRole(memberId, Role.COMMUNITY_MEMBER);

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

    const isMember = await this.isMemberOfAdminsCommunity(
      memberId,
      communityId,
      adminId,
    );

    if (!isMember) {
      throw new HttpException(
        'You can not remove member from this community',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.communityRepository.findOneAndUpdate(
      { _id: communityId },
      { $pull: { membersIds: memberId } },
    );

    const memberCommunities = await this.findByUser(memberId);

    if (memberCommunities.length === 0) {
      await this.usersService.removeRole(memberId, Role.COMMUNITY_MEMBER);
    }

    return true;
  }

  async delete(communityId: string, adminId: string): Promise<boolean> {
    const deleteCommunity = await this.communityRepository.findOneAndDelete({
      _id: communityId,
      adminId,
    });

    if (!deleteCommunity) {
      throw new NotFoundException('Community not found');
    }

    // could be slow
    await Promise.all(
      deleteCommunity.membersIds.map(async (memberId) => {
        const memberCommunities = await this.findByUser(memberId);
        if (memberCommunities.length === 0) {
          return this.usersService.removeRole(memberId, Role.COMMUNITY_MEMBER);
        }
        return null;
      }),
    );

    return !!deleteCommunity;
  }

  async leave(memberId: string, communityId: string): Promise<boolean> {
    try {
      await this.usersService.findById(memberId);
    } catch (e) {
      throw new NotFoundException('Member not found');
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

    const memberCommunities = await this.findByUser(memberId);

    if (memberCommunities.length === 0) {
      await this.usersService.removeRole(memberId, Role.COMMUNITY_MEMBER);
    }

    return true;
  }
}
