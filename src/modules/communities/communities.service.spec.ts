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

describe('CommunitiesService test', () => {
  let moduleRef: TestingModuleBuilder,
    communitiesService: CommunitiesService,
    communitiesRepository: CommunityRepository,
    userRepository: UserRepository,
    userService: UsersService,
    app: TestingModule,
    adminId: string,
    userId: string,
    memberId: string;

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
  });

  beforeEach(async () => {
    adminId = (
      await userService.create({
        email: faker.internet.email(),
        userId: faker.datatype.uuid(),
      })
    ).id;
    userId = (
      await userService.create({
        email: faker.internet.email(),
        userId: faker.datatype.uuid(),
      })
    ).id;
    memberId = (
      await userService.create({
        email: faker.internet.email(),
        userId: faker.datatype.uuid(),
      })
    ).id;
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
  });

  // it('should pass validation', async () => {
  //   const community = await communitiesRepository.create({
  //     name: 'test',
  //     adminId,
  //     membersIds: [memberId, adminId],
  //   });
  //   const isValid = await communitiesService.validate(
  //     memberId,
  //     community.id,
  //     adminId,
  //   );
  //
  //   expect(isValid).toBeTruthy();
  // });

  // it('should fail validation because user is not community admin', async () => {
  //   const community = await communitiesRepository.create({
  //     name: 'test',
  //     adminId,
  //     membersIds: [memberId, adminId],
  //   });
  //   try {
  //     await communitiesService.validate(memberId, community.id, userId);
  //   } catch (e) {
  //     expect(e.message).toBe('You are not admin of this community');
  //   }
  // });
  //
  // it('should fail validation because member is not community admin', async () => {
  //   const community = await communitiesRepository.create({
  //     name: 'test',
  //     adminId,
  //     membersIds: [memberId, adminId],
  //   });
  //   try {
  //     await communitiesService.validate(memberId, community.id, memberId);
  //   } catch (e) {
  //     expect(e.message).toBe('You are not admin of this community');
  //   }
  // });
  //
  // it('should fail validation because admin is not the admin of this community', async () => {
  //   await communitiesRepository.create({
  //     name: 'test',
  //     adminId,
  //     membersIds: [memberId, adminId],
  //   });
  //   const community2 = await communitiesRepository.create({
  //     name: 'test',
  //     adminId: userId,
  //     membersIds: [memberId, userId],
  //   });
  //
  //   try {
  //     await communitiesService.validate(memberId, community2.id, adminId);
  //   } catch (e) {
  //     expect(e.message).toBe('You are not admin of this community');
  //   }
  // });
  //
  // it('should fail validation because member is not a member of this community', async () => {
  //   const community = await communitiesRepository.create({
  //     name: 'test',
  //     adminId,
  //     membersIds: [memberId, adminId],
  //   });
  //
  //   try {
  //     await communitiesService.validate(userId, community.id, adminId);
  //   } catch (e) {
  //     expect(e.message).toBe('User not found');
  //   }
  // });

  it('should create a community', async () => {
    const community = await communitiesService.create({
      name: 'test',
      adminId,
    });
    const admin = await userRepository.findById(adminId);
    expect(community).toHaveProperty('_id');
    expect(community.name).toBe('test');
    expect(community.membersIds).toEqual([adminId]);
    expect(community.adminId).toEqual(adminId);
    //  expect(admin.role).toEqual(Role.COMMUNITY_ADMIN);
  });

  it('should add a member to a community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId],
    });

    const success = await communitiesService.addMember(
      memberId,
      community.id,
      adminId,
    );
    const member = await userRepository.findById(memberId);
    // expect(member.role).toEqual(Role.COMMUNITY_MEMBER);
    expect(success).toBeTruthy();
  });

  it('should fail to add a member to a community because user is not admin', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId],
    });

    try {
      await communitiesService.addMember(memberId, community.id, userId);
    } catch (e) {
      expect(e.message).toBe('You can not add member to this community');
    }
  });
  it("should fail to add a member to a community because member doesn't exist", async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId],
    });

    try {
      await communitiesService.addMember(
        faker.database.mongodbObjectId(),
        community.id,
        adminId,
      );
    } catch (e) {
      expect(e.message).toBe('This member does not exist');
    }
  });
  it('should fail to add a member to a community because member is already a member', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    try {
      await communitiesService.addMember(memberId, community.id, adminId);
    } catch (e) {
      expect(e.message).toBe('Member already in community');
    }
  });
  it('should fail to add a member to a community because community does not exist', async () => {
    try {
      await communitiesService.addMember(
        memberId,
        faker.database.mongodbObjectId(),
        adminId,
      );
    } catch (e) {
      expect(e.message).toBe('You can not add member to this community');
    }
  });
  it('should remove a member from community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    const success = await communitiesService.removeMember(
      memberId,
      community.id,
      adminId,
    );
    const member = await userRepository.findById(memberId);
    //expect(member.role).toEqual(Role.POWER_PLANT_OWNER);
    expect(success).toBeTruthy();
  });
  it('should fail to remove a member from community because user is not admin', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    try {
      await communitiesService.removeMember(memberId, community.id, userId);
    } catch (e) {
      expect(e.message).toBe('You can not remove member from this community');
    }
  });
  it('should fail to because admin can not remove himself', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    try {
      await communitiesService.removeMember(adminId, community.id, adminId);
    } catch (e) {
      expect(e.message).toBe('Admin can not remove himself');
    }
  });
  it('should allow member to leave community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    const success = await communitiesService.leave(memberId, community.id);
    const member = await userRepository.findById(memberId);
    //expect(member.role).toEqual(Role.POWER_PLANT_OWNER);
    expect(success).toBeTruthy();
  });
  it('should fail to remove a member from community because member is not a member of this community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    try {
      await communitiesService.leave(userId, community.id);
    } catch (e) {
      expect(e.message).toBe('You are not member of this community');
    }
  });
  it('shloud not allow addmin to leave community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    try {
      await communitiesService.leave(adminId, community.id);
    } catch (e) {
      expect(e.message).toBe('Admin can not leave community');
    }
  });
  it('should delete community successfully', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    const success = await communitiesService.delete(community.id, adminId);
    const admin = await userRepository.findById(adminId);
    const member = await userRepository.findById(memberId);
    // expect(member.role).toEqual(Role.POWER_PLANT_OWNER);
    expect(success).toBeTruthy();
    // expect(admin.role).toEqual(Role.POWER_PLANT_OWNER);
  });
  it('should fail to delete community because your a not the admin', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    try {
      await communitiesService.delete(community.id, userId);
    } catch (e) {
      expect(e.message).toBe('Community not found');
    }
  });
  it('should find community by id', async () => {
    const communityId = (
      await communitiesService.create({
        name: 'test',
        adminId,
      })
    ).id;

    const foundCommunity = await communitiesService.findById(communityId);
    expect(foundCommunity.id).toEqual(communityId);
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
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    const foundCommunity = await communitiesService.findByUser(memberId);
    expect(foundCommunity.length).toEqual(2);
  });
  it('should find return empty array if user is not in anz community', async () => {
    const foundCommunity = await communitiesService.findByUser(memberId);
    expect(foundCommunity.length).toEqual(0);
    expect(foundCommunity).toEqual([]);
  });
});
