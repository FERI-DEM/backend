import { UsersService } from '../users/users.service';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AuthService } from './auth.service';
import settings from '../../app.settings';
import { AuthModule } from './auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FirebaseService } from '../../common/services';
import { UserRepository } from '../users/repositories/user.repository';
import { faker } from '@faker-js/faker';
import { Role } from '../../common/types';

const spyFindByEmail = jest.spyOn(UsersService.prototype, 'findByEmail');
const spyCreate = jest.spyOn(UsersService.prototype, 'create');
describe('Auth service test', () => {
  let moduleRef: TestingModuleBuilder,
    app: TestingModule,
    authService: AuthService,
    usersService: UsersService,
    userRep: UserRepository;

  const email = faker.internet.email();

  const firebaseServiceMock = {
    auth: {
      verifyIdToken: jest.fn().mockResolvedValue({
        email,
        uid: faker.datatype.uuid(),
      }),
    },
  } as unknown as jest.Mocked<Pick<FirebaseService, 'auth'>>;

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [AuthModule, MongooseModule.forRoot(settings.database.uri)],
    })
      .overrideProvider(FirebaseService)
      .useValue(firebaseServiceMock);

    app = await moduleRef.compile();
    authService = app.get(AuthService);
    usersService = app.get(UsersService);
    userRep = app.get(UserRepository);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  afterEach(async () => {
    await userRep.deleteAll();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(app).toBeDefined();
    expect(moduleRef).toBeDefined();
    expect(userRep).toBeDefined();
  });

  it('should create user if not found in db', async () => {
    const user = await authService.validateUser('token');
    expect(spyCreate).toHaveBeenCalled();
    expect(spyFindByEmail).toHaveBeenCalled();
    expect(user).toBeDefined();
  });
  it('should find user db', async () => {
    await usersService.create({
      userId: faker.datatype.uuid(),
      email,
    });
    jest.clearAllMocks();
    const user = await authService.validateUser('token');
    expect(spyCreate).toHaveBeenCalledTimes(0);
    expect(spyFindByEmail).toHaveBeenCalled();
    expect(user).toBeDefined();
  });
  it('firebase should thorw error if token is invalid', async () => {
    firebaseServiceMock.auth.verifyIdToken = jest
      .fn()
      .mockRejectedValueOnce(new Error('Invalid token'));

    await expect(authService.validateUser('token')).rejects.toThrowError(
      'Invalid token',
    );
    expect(spyCreate).toHaveBeenCalledTimes(0);
    expect(spyFindByEmail).toHaveBeenCalledTimes(0);
  });
  it('should return true if user has required role', async () => {
    const isValid = await authService.validateRole([Role.ADMIN], [Role.ADMIN]);
    expect(isValid).toBeTruthy();
  });
  it('should return true if user has one of required roles', async () => {
    const isValid = await authService.validateRole(
      [Role.ADMIN, Role.BASIC_USER],
      [Role.BASIC_USER],
    );
    expect(isValid).toBeTruthy();
  });
  it('should throw error if user has not required role', async () => {
    await expect(
      authService.validateRole([Role.ADMIN], [Role.BASIC_USER]),
    ).rejects.toThrowError(
      'This resource is forbidden for this user that do not have the following roles: admin',
    );
  });
});
