import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { CommunityRepository } from './repository/community.repository';
import { CommunitiesService } from './communities.service';
import settings from '../../app.settings';
import { CommunitiesModule } from './communities.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRepository } from '../users/repositories/user.repository';
import { UsersService } from '../users/users.service';
import { faker } from '@faker-js/faker';
import { AuthModule } from '../auth/auth.module';
import { Notification, NotificationType, Role } from '../../common/types';
import { CreatePowerPlantDto } from '../power-plants/dto';
import { PowerPlantsService } from '../power-plants/power-plants.service';
import { FirebaseService, NotificationsService } from '../../common/services';

describe('CommunitiesService test', () => {
  let moduleRef: TestingModuleBuilder,
    communitiesService: CommunitiesService,
    communitiesRepository: CommunityRepository,
    userRepository: UserRepository,
    userService: UsersService,
    powerPlantsService: PowerPlantsService,
    notificationService: NotificationsService,
    app: TestingModule,
    adminId: string,
    userId: string,
    memberId: string,
    memberEmail: string;

  const memberFirebaseId = 'test1';
  const adminFirebaseId = 'test2';

  const powerPlantData: CreatePowerPlantDto = {
    displayName: faker.name.firstName(),
    latitude: 30,
    longitude: 30,
  };

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [
        AuthModule,
        CommunitiesModule,
        MongooseModule.forRoot(settings.database.uri),
      ],
    });
    app = await moduleRef.compile();
    communitiesService = app.get(CommunitiesService);
    communitiesRepository = app.get(CommunityRepository);
    userRepository = app.get(UserRepository);
    userService = app.get(UsersService);
    powerPlantsService = app.get(PowerPlantsService);
    notificationService = app.get(NotificationsService);
    const firebaseService = app.get(FirebaseService);

    jest
      .spyOn(notificationService, 'send')
      .mockImplementation(async () => true);
    jest
      .spyOn(firebaseService.auth, 'setCustomUserClaims')
      .mockImplementation(() => Promise.resolve());
  });

  beforeEach(async () => {
    adminId = (
      await userService.create({
        email: faker.internet.email(),
        userId: adminFirebaseId,
        roles: [Role.COMMUNITY_ADMIN, Role.POWER_PLANT_OWNER],
      })
    ).id;
    userId = (
      await userService.create({
        email: faker.internet.email(),
        userId: faker.datatype.uuid(),
        roles: [Role.COMMUNITY_MEMBER, Role.POWER_PLANT_OWNER],
      })
    ).id;
    const member = await userService.create({
      email: faker.internet.email(),
      userId: memberFirebaseId,
      roles: [Role.COMMUNITY_MEMBER, Role.POWER_PLANT_OWNER],
    });
    memberId = member.id;
    memberEmail = member.email;
  });

  afterAll(async () => {
    if (app) {
      app.flushLogs();
      await app.close();
    }
  });

  afterEach(async () => {
    await communitiesRepository.deleteAll();
    await userRepository.deleteAll();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(moduleRef).toBeDefined();
    expect(communitiesService).toBeDefined();
    expect(communitiesRepository).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(userService).toBeDefined();
    expect(powerPlantsService).toBeDefined();
    expect(notificationService).toBeDefined();
  });

  it('should return true if user is community admin', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [{ userId: adminId, powerPlantId: '' }],
    });
    const isAdmin = await communitiesService.isCommunityAdmin(
      community.id,
      adminId,
    );
    expect(isAdmin).toBeTruthy();
  });

  it('should return false if user is not community admin', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [{ userId: adminId, powerPlantId: '' }],
    });
    const isAdmin = await communitiesService.isCommunityAdmin(
      community.id,
      userId,
    );
    expect(isAdmin).toBeFalsy();
  });

  it('should remove a member from community', async () => {
    const powerPlant = await powerPlantsService.create(
      memberId,
      'test',
      powerPlantData,
    );

    const powerPlantId = powerPlant._id.toString();

    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: powerPlantId },
      ],
    });

    const success = await communitiesService.removePowerPlants(
      [powerPlantId],
      memberId,
      community.id,
      adminId,
    );
    const member = await userRepository.findById(memberId);
    const updateCom = await communitiesRepository.findById(community.id);
    expect(updateCom.members.length).toBe(1);
    expect(member.roles.includes(Role.POWER_PLANT_OWNER)).toBeTruthy();
    expect(success).toBeTruthy();
  });
  it('should fail to remove a member from community because user is not admin', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    try {
      await communitiesService.removePowerPlants(
        [],
        memberId,
        community.id,
        userId,
      );
    } catch (e) {
      expect(e.message).toBe('You can not remove member from this community');
    }
  });
  it('should fail to because admin can not remove himself', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    try {
      await communitiesService.removePowerPlants(
        [],
        adminId,
        community.id,
        adminId,
      );
    } catch (e) {
      expect(e.message).toBe('Admin can not remove himself');
    }
  });
  it('should allow member to leave community', async () => {
    const powerPlant = await powerPlantsService.create(
      memberId,
      'test',
      powerPlantData,
    );

    const powerPlantId = powerPlant._id.toString();

    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: powerPlantId },
      ],
    });

    const success = await communitiesService.leave(
      [powerPlantId],
      memberId,
      community.id,
    );
    const member = await userRepository.findById(memberId);
    const updateCom = await communitiesRepository.findById(community.id);
    expect(member.roles.includes(Role.POWER_PLANT_OWNER)).toBeTruthy();
    expect(success).toBeTruthy();
    expect(updateCom.members.length).toBe(1);
  });
  it('should fail to remove a member from community because member is not a member of this community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    try {
      await communitiesService.leave([], userId, community.id);
    } catch (e) {
      expect(e.message).toBe('You are not member of this community');
    }
  });
  it('should not allow admin to leave community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    try {
      await communitiesService.leave([], adminId, community.id);
    } catch (e) {
      expect(e.message).toBe('Admin can not leave community');
    }
  });
  it('should delete community successfully', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    const success = await communitiesService.delete(community.id, adminId);
    const admin = await userRepository.findById(adminId);
    const member = await userRepository.findById(memberId);
    expect(member.roles.includes(Role.POWER_PLANT_OWNER)).toBeTruthy();
    expect(success).toBeTruthy();
    expect(admin.roles.includes(Role.POWER_PLANT_OWNER)).toBeTruthy();
  });
  it('should fail to delete community because your a not the admin', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    try {
      await communitiesService.delete(community.id, userId);
    } catch (e) {
      expect(e.message).toBe('Community not found');
    }
  });
  it("should fail to find community by id because it doesn't exist", async () => {
    try {
      await communitiesService.findById(faker.database.mongodbObjectId());
    } catch (e) {
      expect(e.message).toBe('Community not found');
    }
  });
  it('should find community by userId', async () => {
    await communitiesRepository.create({
      name: 'test1',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    await communitiesRepository.create({
      name: 'tes2t',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    const foundCommunity = await communitiesService.findByUser(adminId);
    expect(foundCommunity.length).toEqual(2);
  });
  it('should find return empty array if user is not in anz community', async () => {
    const foundCommunity = await communitiesService.findByUser(memberId);
    expect(foundCommunity.length).toEqual(0);
    expect(foundCommunity).toEqual([]);
  });
  it('should  allow user to send a request to join community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [{ userId: adminId, powerPlantId: '' }],
    });

    const reqUser = {
      id: memberId,
      email: memberEmail,
      userId: 'test',
      roles: [Role.POWER_PLANT_OWNER],
    };

    const powerPlant = await powerPlantsService.create(
      memberId,
      'test',
      powerPlantData,
    );

    const powerPlantId = powerPlant._id.toString();

    const res = await communitiesService.requestToJoin({
      user: reqUser,
      community: community.name,
      powerPlants: [powerPlantId],
    });
    expect(res.status).toEqual('ok');
  });
  it('should not allow user to send a request to join community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [{ userId: adminId, powerPlantId: '' }],
    });

    const reqUser = {
      id: userId,
      email: memberEmail,
      userId: 'test',
      roles: [Role.POWER_PLANT_OWNER],
    };

    const powerPlant = await powerPlantsService.create(
      memberId,
      'test',
      powerPlantData,
    );

    const powerPlantId = powerPlant._id.toString();

    let errorMsg = '';
    try {
      await communitiesService.requestToJoin({
        user: reqUser,
        community: community.name,
        powerPlants: [powerPlantId],
      });
    } catch (e) {
      errorMsg = e.message;
    }
    expect(errorMsg).toBe(
      'You do not own all power plants that you want to join the community with',
    );
  });
  it('should decline request to join community', async () => {
    jest
      .spyOn(notificationService, 'process')
      .mockImplementationOnce(async () => {
        return {
          id: 'test',
          receiverId: adminFirebaseId,
          senderId: memberFirebaseId,
          type: NotificationType.REQUEST_TO_JOIN,
          data: 'test',
          processed: true,
          createdAt: new Date(),
        } as unknown as Notification<string>;
      });

    const res = await communitiesService.processRequest({
      notificationId: 'test',
      accepted: false,
      adminId: adminId,
    });

    expect(res.status).toEqual('ok');
    expect(res.message).toEqual('Request rejected');
  });
  it('should add power plant to the community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [{ userId: adminId, powerPlantId: '' }],
    });

    const newUserFirebaseId = 'test3';
    const newUserId = (
      await userService.create({
        email: faker.internet.email(),
        userId: newUserFirebaseId,
        roles: [Role.POWER_PLANT_OWNER],
      })
    ).id;

    const powerPlant = await powerPlantsService.create(
      newUserId,
      newUserFirebaseId,
      powerPlantData,
    );

    jest
      .spyOn(notificationService, 'process')
      .mockImplementationOnce(async () => {
        return {
          id: 'test',
          receiverId: adminFirebaseId,
          senderId: newUserFirebaseId,
          type: NotificationType.REQUEST_TO_JOIN,
          data: {
            communityId: community.id,
            userId: newUserFirebaseId,
            powerPlants: [powerPlant._id.toString()],
          },
          processed: true,
          createdAt: new Date(),
        } as unknown as Notification<{
          communityId: string;
          userId: string;
          powerPlants: string[];
        }>;
      });

    const user = await userRepository.findById(newUserId);

    const res = await communitiesService.processRequest({
      notificationId: 'test',
      accepted: true,
      adminId: adminId,
    });

    const updatedCommunity = await communitiesRepository.findById(community.id);
    const isPowerPlantInCommunity = updatedCommunity.members.some(
      (member) => member.powerPlantId === powerPlant._id.toString(),
    );

    const updatedUser = await userRepository.findById(newUserId);

    expect(user.roles.includes(Role.COMMUNITY_MEMBER)).toBeFalsy();
    expect(updatedUser.roles.includes(Role.COMMUNITY_MEMBER)).toBeTruthy();
    expect(res.status).toEqual('ok');
    expect(res.message).toEqual('Request accepted');
    expect(isPowerPlantInCommunity).toBeTruthy();
  });
  it('should remove power plant to the community', async () => {
    const newUserFirebaseId = 'test3';
    const newUserId = (
      await userService.create({
        email: faker.internet.email(),
        userId: newUserFirebaseId,
        roles: [Role.POWER_PLANT_OWNER],
      })
    ).id;

    const powerPlant = await powerPlantsService.create(
      newUserId,
      newUserFirebaseId,
      powerPlantData,
    );

    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: newUserId, powerPlantId: powerPlant._id.toString() },
      ],
    });

    const res = await communitiesService.removePowerPlants(
      [powerPlant._id.toString()],
      newUserId,
      community.id,
      adminId,
    );

    expect(res).toBeTruthy();

    const updatedCommunity = await communitiesRepository.findById(community.id);
    const isPowerPlantInCommunity = updatedCommunity.members.some(
      (member) => member.powerPlantId === powerPlant._id.toString(),
    );
    expect(isPowerPlantInCommunity).toBeFalsy();
  });
  it('should be member of admins community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      members: [
        { userId: adminId, powerPlantId: '' },
        { userId: memberId, powerPlantId: '' },
      ],
    });

    const isMember = await communitiesService.isMemberOfAdminsCommunity(
      memberId,
      community.id,
      adminId,
    );
    expect(isMember).toBeTruthy();
  });
});
