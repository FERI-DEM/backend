import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import settings from '../../app.settings';

describe('UsersController test', () => {
  let moduleRef: TestingModuleBuilder,
    app: TestingModule,
    controller: UsersController;

  const userData = {
    id: '64064ccd62bdeec513ad2f0b',
    email: 'test@test.com',
    firstname: 'John',
    lastname: 'Doe',
  };

  const userServiceMock = {
    findByEmail: jest.fn().mockResolvedValue(userData),
    findById: jest.fn().mockResolvedValue(userData),
  } as jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [UsersModule, MongooseModule.forRoot(settings.database.uri)],
    })
      .overrideProvider(UsersService)
      .useValue(userServiceMock);
    app = await moduleRef.compile();
    controller = app.get(UsersController);
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

  it('should find a user by email', async () => {
    const res = await controller.findByEmail(userData.email);
    expect(res).toBeTruthy();
    expect(userServiceMock.findByEmail).toBeCalledWith(userData.email);
  });

  it('should find a user by id', async () => {
    const res = await controller.findById(userData.id);
    expect(res).toBeTruthy();
    expect(userServiceMock.findById).toBeCalledWith(userData.id);
  });
});
