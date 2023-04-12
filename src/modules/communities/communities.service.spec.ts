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
import { Role } from '../../common/types';

describe('CommunitiesService test', () => {
  let moduleRef: TestingModuleBuilder,
    communitiesService: CommunitiesService,
    communitiesRepository: CommunityRepository,
    userRepository: UserRepository,
    userService: UsersService,
    app: TestingModule,
    adminId: string,
    userId: string,
    memberId: string,
    memberEmail: string;

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
      userId: faker.datatype.uuid(),
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
  });

  it("should return true if member is in admins' community", async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId],
    });
    const isMember = await communitiesService.isMemberOfAdminsCommunity(
      adminId,
      community.id,
      adminId,
    );
    expect(isMember).toBeTruthy();
  });

  it("should return false if member is not in admins' community", async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId],
    });
    const isMember = await communitiesService.isMemberOfAdminsCommunity(
      userId,
      community.id,
      adminId,
    );
    expect(isMember).toBeFalsy();
  });

  it('should return true if user is community admin', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId],
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
      membersIds: [adminId],
    });
    const isAdmin = await communitiesService.isCommunityAdmin(
      community.id,
      userId,
    );
    expect(isAdmin).toBeFalsy();
  });

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
    expect(admin.roles.includes(Role.COMMUNITY_ADMIN)).toBeTruthy();
  });

  it('should add a member to a community', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId],
    });

    const success = await communitiesService.addMember(
      memberEmail,
      community.id,
      adminId,
    );
    const member = await userRepository.findById(memberId);
    expect(member.roles.includes(Role.COMMUNITY_MEMBER)).toBeTruthy();
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
      expect(e.message).toBe('Member not found');
    }
  });
  it('should fail to add a member to a community because member is already a member', async () => {
    const community = await communitiesRepository.create({
      name: 'test',
      adminId,
      membersIds: [adminId, memberId],
    });

    try {
      await communitiesService.addMember(memberEmail, community.id, adminId);
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
    expect(member.roles.includes(Role.POWER_PLANT_OWNER)).toBeTruthy();
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
    expect(member.roles.includes(Role.POWER_PLANT_OWNER)).toBeTruthy();
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
    expect(member.roles.includes(Role.POWER_PLANT_OWNER)).toBeTruthy();
    expect(success).toBeTruthy();
    expect(admin.roles.includes(Role.POWER_PLANT_OWNER)).toBeTruthy();
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
