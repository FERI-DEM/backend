import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { CommunitiesController } from './communities.controller';
import { CommunitiesModule } from './communities.module';
import { MongooseModule } from '@nestjs/mongoose';
import settings from '../../app.settings';
import { faker } from '@faker-js/faker';
import { CommunitiesService } from './communities.service';
import { AuthModule } from '../auth/auth.module';

describe('CommunitiesController test', () => {
  let moduleRef: TestingModuleBuilder,
    app: TestingModule,
    controller: CommunitiesController;

  const communityData = {
    id: faker.database.mongodbObjectId(),
    name: faker.company.name(),
    adminId: faker.database.mongodbObjectId(),
    membersIds: [faker.database.mongodbObjectId()],
  };

  const communityServiceMock = {
    findById: jest.fn().mockResolvedValue(communityData),
    findByUser: jest.fn().mockResolvedValue([communityData]),
    create: jest.fn().mockResolvedValue(communityData),
    leave: jest.fn().mockResolvedValue(true),
    removeMember: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
    addMember: jest.fn().mockResolvedValue(true),
  } as jest.Mocked<
    Pick<
      CommunitiesService,
      | 'findById'
      | 'findByUser'
      | 'create'
      | 'leave'
      | 'removeMember'
      | 'delete'
      | 'addMember'
    >
  >;

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [
        AuthModule,
        CommunitiesModule,
        MongooseModule.forRoot(settings.database.uri),
      ],
    })
      .overrideProvider(CommunitiesService)
      .useValue(communityServiceMock);

    app = await moduleRef.compile();
    controller = app.get(CommunitiesController);
  });

  afterAll(async () => {
    if (app) {
      app.flushLogs();
      await app.close();
    }
  });

  it('should be defined', async () => {
    expect(app).toBeDefined();
    expect(moduleRef).toBeDefined();
    expect(controller).toBeDefined();
  });
  it('should find a community by id', async () => {
    const res = await controller.findById(communityData.id);
    expect(res).toBeTruthy();
    expect(communityServiceMock.findById).toBeCalledWith(communityData.id);
  });
  it('should find communities by user id', async () => {
    const res = await controller.findCommunityByUser(communityData.adminId);
    expect(res).toBeTruthy();
    expect(communityServiceMock.findByUser).toBeCalledWith(
      communityData.adminId,
    );
  });
  it('should create a community', async () => {
    const res = await controller.create(
      { name: 'test' },
      communityData.adminId,
    );
    expect(res).toBeTruthy();
    expect(communityServiceMock.create).toBeCalledWith({
      name: 'test',
      adminId: communityData.adminId,
    });
  });
  it('should leave a community', async () => {
    const res = await controller.leave(communityData.id, communityData.adminId);
    expect(res).toBeTruthy();
    expect(communityServiceMock.leave).toBeCalledWith(
      communityData.adminId,
      communityData.id,
    );
  });
  it('should remove a member from a community', async () => {
    const res = await controller.deleteMember(
      communityData.id,
      communityData.membersIds[0],
      communityData.adminId,
    );
    expect(res).toBeTruthy();
    expect(communityServiceMock.removeMember).toBeCalledWith(
      communityData.id,
      communityData.membersIds[0],
      communityData.adminId,
    );
  });
  it('should delete a community', async () => {
    const res = await controller.delete(
      communityData.id,
      communityData.adminId,
    );
    expect(res).toBeTruthy();
    expect(communityServiceMock.delete).toBeCalledWith(
      communityData.id,
      communityData.adminId,
    );
  });
  it('should add a member to a community', async () => {
    const memberEmail = faker.internet.email();
    const res = await controller.addMember(
      { email: memberEmail },
      communityData.id,
      communityData.adminId,
    );
    expect(res).toBeTruthy();
    expect(communityServiceMock.addMember).toBeCalledWith(
      memberEmail,
      communityData.id,
      communityData.adminId,
    );
  });
});
