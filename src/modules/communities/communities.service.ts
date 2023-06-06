import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommunityDto, RequestToJoinDto } from './dto';
import { UsersService } from '../users/users.service';
import { NotificationType, RequestUser, Role } from '../../common/types';
import { CommunityRepository } from './repository/community.repository';
import { CommunityDocument } from './schemas/community.schema';
import mongoose from 'mongoose';
import { Community } from './types/community.types';
import { PowerPlantsService } from '../power-plants/power-plants.service';
import { NotificationsService } from '../../common/services';
import { ProcessRequestDto } from './dto/process-request.dto';
import { Statistics } from '../power-plants/types';

@Injectable()
export class CommunitiesService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly usersService: UsersService,
    private readonly powerPlantsService: PowerPlantsService,
    private readonly notificationService: NotificationsService,
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

  async productionStatistics(communityId: string, type: Statistics) {
    const community = await this.communityRepository.findOne({
      _id: communityId,
    });

    const powerPlants = community.members.map(({ powerPlantId }) => ({
      powerPlantId,
    }));

    const result = await Promise.all(
      powerPlants.map(
        ({ powerPlantId }) =>
          this.powerPlantsService.getProductionStatistics(
            powerPlantId.toString(),
            type,
          ) as Promise<{ now: number; before: number; type: Statistics }>,
      ),
    );

    let now = 0;
    for (let i = 0; i < result.length; i++) {
      now += result[i].now;
    }

    let before = 0;
    for (let i = 0; i < result.length; i++) {
      before += result[i].before;
    }
    return { now, before, type };
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

  async findById(id: string): Promise<Community> {
    const communityResult = await this.communityRepository.findByIdWithLookup(
      id,
    );
    if (!communityResult && communityResult.length === 0) {
      throw new NotFoundException('Community not found');
    }
    return communityResult[0];
  }

  async create(
    data: CreateCommunityDto & { adminId: string },
  ): Promise<CommunityDocument> {
    const members = data.powerPlants.map(({ powerPlantId }) => ({
      powerPlantId: new mongoose.Types.ObjectId(powerPlantId),
      userId: new mongoose.Types.ObjectId(data.adminId),
    }));

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

  async requestToJoin(data: RequestToJoinDto & { user: RequestUser }) {
    const { id: userId, userId: userFirebaseId } = data.user;

    const community = await this.communityRepository.findOne({
      _id: data.communityId,
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const { powerPlants } = await this.powerPlantsService.findByUser(userId);

    // check if user owns power plants
    const isOwnerOfPowerPlants = data.powerPlants.every((powerPlant) =>
      powerPlants.find((p) => p._id.toString() === powerPlant),
    );

    if (!isOwnerOfPowerPlants) {
      throw new HttpException(
        'You do not own all power plants that you want to join the community with',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.usersService.findById(userId);

    const { userId: adminFirebaseId } = await this.usersService.findById(
      community.adminId,
    );

    await this.notificationService.send({
      type: NotificationType.REQUEST_TO_JOIN,
      receiverId: adminFirebaseId,
      senderId: userFirebaseId,
      data: {
        communityId: data.communityId,
        userId: userFirebaseId,
        powerPlants: data.powerPlants,
        message: `User with email ${user.email} wants to join your ${community.name} community with ${data.powerPlants.length} power plants`,
      },
    });

    return { status: 'ok', message: 'Request sent successfully' };
  }

  async processRequest(data: ProcessRequestDto & { adminId: string }) {
    const { userId: adminFirebaseId } = await this.usersService.findById(
      data.adminId,
    );

    const notification = await this.notificationService.process<{
      communityId: string;
      userId: string;
      powerPlants: string[];
    }>(data.notificationId, adminFirebaseId);

    if (!data.accepted) return { status: 'ok', message: 'Request rejected' };

    const { id: memberId } = await this.usersService.findByFirebaseId(
      notification.data.userId,
    );

    await this.addPowerPlants(
      notification.data.powerPlants,
      notification.data.communityId,
      data.adminId,
      memberId,
    );

    return { status: 'ok', message: 'Request accepted' };
  }

  async addPowerPlants(
    powerPlants: string[],
    communityId: string,
    adminId: string,
    memberId: string,
  ): Promise<boolean> {
    const isAdmin = await this.isCommunityAdmin(communityId, adminId);

    if (!isAdmin) {
      throw new HttpException(
        'You can not add member to this community',
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    const member = await this.usersService.findById(memberId);
    if (!member) {
      throw new HttpException('Member not found', HttpStatus.BAD_REQUEST);
    }

    // check if some of powerPlantsIds are already in this community  powerPlantIds
    const community = await this.communityRepository.findOne({
      _id: communityId,
      powerPlantIds: { $in: powerPlants },
    });

    if (community) {
      throw new HttpException(
        'Power plant is already in community',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.communityRepository.findOneAndUpdate(
      { _id: communityId },
      { $push: { powerPlantIds: powerPlants } },
    );

    await this.usersService.addRole(memberId, Role.COMMUNITY_MEMBER);

    return true;
  }

  async removePowerPlants(
    powerPlants: string[],
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

    const com = await this.communityRepository.findOneAndUpdate(
      { _id: communityId },
      {
        $pullAll: { powerPlantIds: powerPlants },
      },
    );

    // TODO every hard to do if we uses power plants and community member indication
    // const memberCommunities = await this.findByUser(memberId);
    //
    // if (memberCommunities.length === 0) {
    //   await this.usersService.removeRole(memberId, Role.COMMUNITY_MEMBER);
    // }

    return true;
  }
}
