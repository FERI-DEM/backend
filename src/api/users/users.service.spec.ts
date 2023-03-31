import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import settings from '../../app.settings';
import { Role } from '../../common/types';
import { UserRepository } from './repositories/user.repository';
import { faker } from '@faker-js/faker';

describe('UsersService test', () => {
  let moduleRef: TestingModuleBuilder,
    userService: UsersService,
    app: TestingModule,
    userRepository: UserRepository;
  const userData = {
    email: faker.internet.email(),
    firstname: faker.name.firstName(),
    lastname: faker.name.lastName(),
  };

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [UsersModule, MongooseModule.forRoot(settings.database.uri)],
    });
    app = await moduleRef.compile();
    userService = app.get(UsersService);
    userRepository = app.get(UserRepository);
  });

  afterAll(async () => {
    await userRepository.dropCollection();
    if (app) {
      app.flushLogs();
      await app.close();
    }
  });

  it('should be defined', async () => {
    expect(app).toBeDefined();
    expect(moduleRef).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(userService).toBeDefined();
  });

  it('should create a user', async () => {
    const user = await userService.create(userData);
    expect(user).toMatchObject(userData);
    expect(user).toHaveProperty('_id');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
    expect(user.role).toBe(Role.BASIC_USER);
    expect(user.powerPlants).toEqual([]);
  });

  it('should find a user by email', async () => {
    const user = await userService.create(userData);
    const foundUser = await userService.findByEmail(userData.email);
    expect(foundUser.email).toEqual(user.email);
  });

  it('should throw an error if user is not found by email', async () => {
    try {
      await userService.findByEmail('');
    } catch (error) {
      expect(error.message).toEqual('User not found');
    }
  });

  it('should find a user by id', async () => {
    const user = await userService.create(userData);
    const foundUser = await userService.findById(user._id);
    expect(foundUser._id).toEqual(user._id);
  });

  it('should throw an error if user is not found by id', async () => {
    try {
      await userService.findById(faker.database.mongodbObjectId());
    } catch (error) {
      expect(error.message).toEqual('User not found');
    }
  });

  it("should change a user's role", async () => {
    const user = await userService.create(userData);
    const updatedUser = await userService.changeRole(user._id, Role.ADMIN);
    expect(updatedUser.role).toBe(Role.ADMIN);
  });

  it('should throw an error if user is not found by id', async () => {
    try {
      await userService.changeRole(
        faker.database.mongodbObjectId(),
        Role.ADMIN,
      );
    } catch (error) {
      expect(error.message).toEqual('User not found');
    }
  });
});
