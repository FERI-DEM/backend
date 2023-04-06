import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import settings from '../../app.settings';
import { Role } from '../../common/types';
import { UserRepository } from './repositories/user.repository';
import { faker } from '@faker-js/faker';
import { UsersModule } from './users.module';
import { AuthModule } from '../auth/auth.module';

describe('UsersService test', () => {
  let moduleRef: TestingModuleBuilder,
    userService: UsersService,
    app: TestingModule,
    userRepository: UserRepository,
    userData: { email: string; userId: string };

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [
        AuthModule,
        UsersModule,
        MongooseModule.forRoot(settings.database.uri),
      ],
    });
    app = await moduleRef.compile();
    userService = app.get(UsersService);
    userRepository = app.get(UserRepository);
  });

  beforeEach(() => {
    userData = {
      email: faker.internet.email(),
      userId: faker.datatype.uuid(),
    };
  });

  afterAll(async () => {
    await userRepository.dropCollection();
    if (app) {
      app.flushLogs();
      await app.close();
    }
  });

  it('should be defined', () => {
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
    expect(user.roles[0]).toBe(Role.BASIC_USER);
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

  it('should add role to user', async () => {
    const user = await userService.create(userData);
    const updatedUser = await userService.addRole(user._id, Role.ADMIN);
    expect(updatedUser.roles.includes(Role.ADMIN)).toBeTruthy();
  });

  it('should remove role form user', async () => {
    const user = await userService.create(userData);
    const updatedUser = await userService.addRole(user._id, Role.ADMIN);
    const removedRoleUser = await userService.removeRole(
      updatedUser._id,
      Role.ADMIN,
    );
    expect(removedRoleUser.roles.includes(Role.ADMIN)).toBeFalsy();
  });
});
