import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import * as request from 'supertest';
import { CommunitiesService } from '../src/modules/communities/communities.service';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { bootstrapGlobalPipes } from '../src/app.bootstrap';

describe('CommunitiesController (e2e)', () => {
  let app: INestApplication, moduleRef: TestingModuleBuilder;
  const url = '/communities';

  const mockCommunityResponseData = {
    _id: faker.database.mongodbObjectId(),
    name: faker.company.name(),
    adminId: faker.database.mongodbObjectId(),
    membersIds: [faker.database.mongodbObjectId()],
  } as Awaited<ReturnType<CommunitiesService['create']>>;

  const mockedResponse = {
    create: jest.fn().mockResolvedValue(mockCommunityResponseData),
    findById: jest.fn().mockResolvedValue(mockCommunityResponseData),
    findByUser: jest.fn().mockResolvedValue([mockCommunityResponseData]),
    addMember: jest.fn().mockResolvedValue(true),
    leave: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
    removeMember: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [AppModule],
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /communities/:id', () => {
    it(' should return 404 when community not found', async () => {
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      await app.init();

      return request(app.getHttpServer())
        .get(`${url}/${mockCommunityResponseData.membersIds[0]}`)
        .expect(404);
    });

    it('should get a community by id', async () => {
      moduleRef.overrideProvider(CommunitiesService).useValue(mockedResponse);
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      await app.init();

      const response = await request(app.getHttpServer())
        .get(`${url}/${mockCommunityResponseData._id}`)
        .expect(200);
      expect(response.body).toEqual(mockCommunityResponseData);
    });
  });

  describe('POST /communities', () => {
    it('should fail if invalid body', async () => {
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      bootstrapGlobalPipes(app);
      await app.init();

      return request(app.getHttpServer()).post(url).send({}).expect(400);
    });

    it('should create a community', async () => {
      moduleRef.overrideProvider(CommunitiesService).useValue(mockedResponse);
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      await app.init();

      const response = await request(app.getHttpServer())
        .post(url)
        .send({ name: 'test' })
        .expect(201);
      expect(response.body).toEqual(mockCommunityResponseData);
    });
  });

  describe('GET /communities', () => {
    it('should get a community by user id', async () => {
      moduleRef.overrideProvider(CommunitiesService).useValue(mockedResponse);
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      await app.init();

      const response = await request(app.getHttpServer()).get(url).expect(200);
      expect(response.body).toEqual([mockCommunityResponseData]);
    });
  });

  describe('PATCH /communities/invite/:id', () => {
    it('should fail if invalid body', async () => {
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      bootstrapGlobalPipes(app);
      await app.init();

      return request(app.getHttpServer())
        .patch(`${url}/invite/${mockCommunityResponseData._id}`)
        .send({})
        .expect(400)
        .expect({
          statusCode: 400,
          error: 'Bad Request',
          message: ['memberId must be a string'],
        });
    });

    it('should add a member to a community', async () => {
      moduleRef.overrideProvider(CommunitiesService).useValue(mockedResponse);
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      await app.init();

      return request(app.getHttpServer())
        .patch(`${url}/invite/${mockCommunityResponseData._id}`)
        .send({ memberId: faker.database.mongodbObjectId() })
        .expect(200)
        .expect('true');
    });
  });

  describe('DELETE /communities/leave/:communityId', () => {
    it('should leave a community', async () => {
      moduleRef.overrideProvider(CommunitiesService).useValue(mockedResponse);
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      await app.init();

      return request(app.getHttpServer())
        .delete(`${url}/leave/${mockCommunityResponseData._id}`)
        .expect(200)
        .expect('true');
    });
  });

  describe('DELETE /communities/:id', () => {
    it('should delete a community', async () => {
      moduleRef.overrideProvider(CommunitiesService).useValue(mockedResponse);
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      await app.init();

      return request(app.getHttpServer())
        .delete(`${url}/${mockCommunityResponseData._id}`)
        .expect(200)
        .expect('true');
    });
  });

  describe('DELETE /communities/remove/:communityId/:memberId', () => {
    it('should remove a member from a community', async () => {
      moduleRef.overrideProvider(CommunitiesService).useValue(mockedResponse);
      const compiledModule = await moduleRef.compile();
      app = compiledModule.createNestApplication();
      await app.init();

      return request(app.getHttpServer())
        .delete(
          `${url}/remove/${mockCommunityResponseData._id}/${mockCommunityResponseData.membersIds[0]}`,
        )
        .expect(200)
        .expect('true');
    });
  });
});
