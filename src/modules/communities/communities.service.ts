import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateCommunityDto,
  RequestToJoinDto,
  UpdateCommunityDto,
} from './dto';
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
      'members.userId': new mongoose.Types.ObjectId(memberId),
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

  async update(communityId: string, data: UpdateCommunityDto) {
    await this.communityRepository.findOneAndUpdate(
      { _id: communityId },
      {
        $set: {
          name: data.name,
        },
      },
    );
  }

  async findByName(name: string) {
    return await this.communityRepository.findAll({
      name: new RegExp(`^${name}$`, 'i'),
    });
  }

  async findByUser(userId: string): Promise<CommunityDocument[]> {
    try {
      return await this.communityRepository.findAll({
        $or: [
          { 'members.userId': new mongoose.Types.ObjectId(userId) },
          { adminId: userId },
        ],
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async findById(id: string): Promise<Community> {
    const communityResult = await this.communityRepository.findByIdWithLookup(
      id,
    );
    if (!communityResult || communityResult.length === 0) {
      throw new NotFoundException('Community not found');
    }
    return communityResult[0];
  }

  async getMembersPowerShare(
    id: string,
  ): Promise<{ user: string; share: number }[]> {
    const communityResult = await this.communityRepository.findByIdWithLookup(
      id,
    );
    if (!communityResult || communityResult.length === 0) {
      throw new NotFoundException('Community not found');
    }
    const community = communityResult[0];

    const sum = community.members.reduce((partialSum, member) => {
      return partialSum + member.calibration.value;
    }, 0);
    return community.members.map((member) => ({
      user: member.userName,
      share: member.calibration.value / sum,
    }));
  }

  async create(
    data: CreateCommunityDto & { adminId: string },
  ): Promise<CommunityDocument> {
    const members = data.powerPlants.map(({ powerPlantId }) => ({
      powerPlantId: new mongoose.Types.ObjectId(powerPlantId),
      userId: new mongoose.Types.ObjectId(data.adminId),
    }));

    const found = await this.communityRepository.findAll({
      adminId: data.adminId,
      name: data.name,
    });

    if (found.length > 0) {
      throw new HttpException(
        'You already have a community with this name',
        HttpStatus.BAD_REQUEST,
      );
    }

    const org = await this.communityRepository.create({
      ...data,
      members,
    });
    if (!org)
      throw new HttpException(
        'Cloud not create community',
        HttpStatus.BAD_REQUEST,
      );

    await this.usersService.addRole(data.adminId, Role.COMMUNITY_ADMIN);
    return org;
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
      deleteCommunity.members.map(async (member) => {
        const memberCommunities = await this.findByUser(member.userId);
        if (memberCommunities.length === 0) {
          return this.usersService.removeRole(
            member.userId,
            Role.COMMUNITY_MEMBER,
          );
        }
        return null;
      }),
    );

    return !!deleteCommunity;
  }

  async leave(
    powerPlants: string[],
    memberId: string,
    communityId: string,
  ): Promise<boolean> {
    try {
      await this.usersService.findById(memberId);
    } catch (e) {
      throw new NotFoundException('Member not found');
    }

    const community = await this.communityRepository.findOne({
      _id: communityId,
      'members.userId': new mongoose.Types.ObjectId(memberId),
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

    for (const powerPlantId of powerPlants) {
      await this.communityRepository.findOneAndUpdate(
        { _id: communityId },
        {
          $pull: {
            members: { userId: memberId, powerPlantId: powerPlantId },
          },
        },
      );
    }

    const memberCommunities = await this.findByUser(memberId);

    if (memberCommunities.length === 0) {
      await this.usersService.removeRole(memberId, Role.COMMUNITY_MEMBER);
    }

    return true;
  }

  async requestToJoin(data: RequestToJoinDto & { user: RequestUser }) {
    const { id: userId, userId: userFirebaseId } = data.user;

    const community = await this.communityRepository.findOne({
      name: data.community,
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
        communityId: community._id.toString(),
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
    for (const powerPlantId of powerPlants) {
      const community = await this.communityRepository.findOne({
        _id: communityId,
        'members.powerPlantId': powerPlantId,
      });

      if (community) {
        throw new HttpException(
          'Power plant is already in community',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    for (const powerPlantId of powerPlants) {
      await this.communityRepository.findOneAndUpdate(
        { _id: communityId },
        {
          $push: { members: { userId: memberId, powerPlantId: powerPlantId } },
        },
      );
    }

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

    const isPowerPlantInCommunity = (
      powerPlantId: string,
      community: CommunityDocument,
    ): boolean => {
      return community.members.some((p) => p.powerPlantId === powerPlantId);
    };

    for (const powerPlantId of powerPlants) {
      // TODO do i need to remove member from community if he has no power plants in it ?
      await this.communityRepository.findOneAndUpdate(
        { _id: communityId },
        {
          $pull: {
            members: { userId: memberId, powerPlantId: powerPlantId },
          },
        },
      );
    }

    const memberCommunities = await this.findByUser(memberId);
    const { powerPlants: memberPowerPlants } =
      await this.powerPlantsService.findByUser(memberId);

    if (memberCommunities.length === 0 && memberPowerPlants.length === 0) {
      await this.usersService.removeRole(memberId, Role.COMMUNITY_MEMBER);
      return true;
    }

    let powerPlantsInCommunities = 0;
    for (let i = 0; i < memberCommunities.length; i++) {
      const community = memberCommunities[i];

      for (let j = 0; j < memberPowerPlants.length; j++) {
        const powerPlantId = memberPowerPlants[j]._id.toString();
        const isIn = isPowerPlantInCommunity(powerPlantId, community);
        if (isIn) {
          powerPlantsInCommunities++;
        }
      }
    }

    if (powerPlantsInCommunities === 0) {
      await this.usersService.removeRole(memberId, Role.COMMUNITY_MEMBER);
    }

    return true;
  }

  async predict(communityId: string) {
    const community = await this.findById(communityId);
    const powerPlants = community.members.map((m) => m.powerPlantId);

    const predictions = (
      await Promise.all(
        powerPlants.map((powerPlantId) =>
          this.powerPlantsService.predict(powerPlantId),
        ),
      )
    ).flat();
    const communityPrediction: typeof predictions = [];

    for (let i = 0; i < predictions.length; i++) {
      const timestamp = predictions[i].date;

      const predictionSum = {
        date: timestamp,
        power: 0,
      };

      for (let j = 0; j < predictions.length; j++) {
        if (timestamp === predictions[j].date) {
          predictionSum.power += predictions[j].power;
        }
      }

      communityPrediction.push(predictionSum);
    }

    return communityPrediction;
  }

  async getCommunityPowerProduction(communityId: string) {
    const community = await this.findById(communityId);
    const powerPlants = community.members.map((m) => m.powerPlantId.toString());

    const production = await Promise.all(
      powerPlants.map((powerPlantId) =>
        this.powerPlantsService.getProduction(powerPlantId),
      ),
    );

    let productionSum = 0;
    for (let i = 0; i < production.length; i++) {
      productionSum += production[i].production;
    }

    return {
      from: production[0].from,
      to: production[0].to,
      powerPlants: production,
      production: productionSum,
    };
  }

  async predictByDays(communityId: string) {
    const community = await this.findById(communityId);

    const predictions = await Promise.all(
      community.members.map((member) =>
        this.powerPlantsService.predictByDays(member.powerPlantId),
      ),
    );

    const result = [];
    for (let i = 0; i < predictions[0].length; i++) {
      let sum = 0;
      for (let j = 0; j < predictions.length; j++) {
        sum += predictions[j][i];
      }
      result.push(sum);
    }
    return result;
  }

  async getCurrentProduction(communityId: string) {
    const community = await this.findById(communityId);
    const powerPlants = community.members.map((m) => m.powerPlantId.toString());
    const currentProduction = await Promise.all(
      powerPlants.map((powerPlantId) =>
        this.powerPlantsService.getCurrentProduction(powerPlantId),
      ),
    );

    let productionSum = 0;
    for (let i = 0; i < currentProduction.length; i++) {
      productionSum += currentProduction[i].production.power;
    }
    return {
      powerPlants: currentProduction,
      production: productionSum,
    };
  }
}
