import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/api/users/users.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication, moduleRef: TestingModuleBuilder;
  const url = '/users';

  const mockUserResponseData = {
    _id: '5f9f1b9e1c9d440000a1e1c1',
    email: 'test@test.com',
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
      .get(`${url}/5f9f1b9e1c9d440000a1e1c1`)
      .expect(404);
  });

  it('/GET user by id should respond with 200', async () => {
    moduleRef.overrideProvider(UsersService).useValue(mockedResponse);
    const compiledModule = await moduleRef.compile();
    app = compiledModule.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .get(`${url}/5f9f1b9e1c9d440000a1e1c1`)
      .expect(200)
      .expect(mockUserResponseData);
  });

  it('/GET user by emil should respond with 404', async () => {
    const compiledModule = await moduleRef.compile();
    app = compiledModule.createNestApplication();
    await app.init();

    return request(app.getHttpServer()).get(`${url}/test@mail.com`).expect(404);
  });

  it('/GET user by emil should respond with 200', async () => {
    moduleRef.overrideProvider(UsersService).useValue(mockedResponse);
    const compiledModule = await moduleRef.compile();
    app = compiledModule.createNestApplication();
    await app.init();

    return request(app.getHttpServer())
      .get(`${url}/test@mail.com`)
      .expect(200)
      .expect(mockUserResponseData);
  });
});
