import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/api/users/users.service';
import { faker } from '@faker-js/faker';

describe('UsersController (e2e)', () => {
  let app: INestApplication, moduleRef: TestingModuleBuilder;
  const url = '/users';

  const mockUserResponseData = {
    _id: faker.database.mongodbObjectId(),
    email: faker.internet.email(),
  } as Awaited<ReturnType<UsersService['findById']>>;

  const mockedResponse = {
    findById: jest.fn().mockResolvedValue(mockUserResponseData),
    findByEmail: jest.fn().mockResolvedValue(mockUserResponseData),
  };

  beforeEach(() => {
    moduleRef = Test.createTestingModule({
      imports: [AppModule],
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('/GET user by id should respond with 404', async () => {
    const compiledModule = await moduleRef.compile();
    app = compiledModule.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .get(`${url}/${faker.database.mongodbObjectId()}`)
      .expect(404);
  });

  it('/GET user by id should respond with 200', async () => {
    moduleRef.overrideProvider(UsersService).useValue(mockedResponse);
    const compiledModule = await moduleRef.compile();
    app = compiledModule.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .get(`${url}/${mockUserResponseData._id}`)
      .expect(200)
      .expect(mockUserResponseData);
  });

  it('/GET user by emil should respond with 404', async () => {
    const compiledModule = await moduleRef.compile();
    app = compiledModule.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .get(`${url}/${faker.internet.email()}`)
      .expect(404);
  });

  it('/GET user by emil should respond with 200', async () => {
    moduleRef.overrideProvider(UsersService).useValue(mockedResponse);
    const compiledModule = await moduleRef.compile();
    app = compiledModule.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .get(`${url}/${mockUserResponseData.email}`)
      .expect(200)
      .expect(mockUserResponseData);
  });
});
