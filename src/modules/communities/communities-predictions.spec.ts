import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { CommunityRepository } from './repository/community.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { UsersService } from '../users/users.service';
import { PowerPlantsService } from '../power-plants/power-plants.service';
import { FirebaseService, NotificationsService } from '../../common/services';
import { faker } from '@faker-js/faker';
import { AuthModule } from '../auth/auth.module';
import { CommunitiesModule } from './communities.module';
import { MongooseModule } from '@nestjs/mongoose';
import settings from '../../app.settings';
import { Role } from '../../common/types';
import { OpenMeteoAPI } from '../forecasts/strategies/open-meteo.strategy';
import mongoose from 'mongoose';

describe('communities predictions test', () => {
  let moduleRef: TestingModuleBuilder,
    communitiesService: CommunitiesService,
    communitiesRepository: CommunityRepository,
    userRepository: UserRepository,
    userService: UsersService,
    powerPlantsService: PowerPlantsService,
    notificationService: NotificationsService,
    app: TestingModule,
    communityId: string,
    powerPlantId,
    userId: string;

  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1);

  const forecastServiceMock = {
    getCurrentSolarRadiation: jest.fn().mockResolvedValue({
      solar: 100,
    }),
    getSolarRadiationForecast: jest
      .fn()
      .mockResolvedValue([{ solar: 100, timestamp: nextHour }]),
  } as unknown as jest.Mocked<
    Pick<OpenMeteoAPI, 'getCurrentSolarRadiation' | 'getSolarRadiationForecast'>
  >;

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [
        AuthModule,
        CommunitiesModule,
        MongooseModule.forRoot(settings.database.uri),
      ],
    })
      .overrideProvider(OpenMeteoAPI)
      .useValue(forecastServiceMock);

    app = await moduleRef.compile();
    communitiesService = app.get(CommunitiesService);
    communitiesRepository = app.get(CommunityRepository);
    userRepository = app.get(UserRepository);
    userService = app.get(UsersService);
    powerPlantsService = app.get(PowerPlantsService);
    notificationService = app.get(NotificationsService);
    const firebaseService = app.get(FirebaseService);

    jest
      .spyOn(notificationService, 'send')
      .mockImplementation(async () => true);
    jest
      .spyOn(firebaseService.auth, 'setCustomUserClaims')
      .mockImplementation(() => Promise.resolve());
    jest.spyOn(powerPlantsService, 'getProduction').mockImplementation(() => {
      return Promise.resolve({
        from: new Date(),
        to: new Date(),
        production: 100,
        powerPlantId: powerPlantId,
        email: faker.internet.email(),
      });
    });
  });

  beforeEach(async () => {
    const adminId = (
      await userService.create({
        email: faker.internet.email(),
        userId: 'test',
        roles: [Role.COMMUNITY_ADMIN, Role.POWER_PLANT_OWNER],
      })
    ).id;

    const powerPlant = await powerPlantsService.create(adminId, 'test', {
      displayName: faker.name.firstName(),
      latitude: 30,
      longitude: 30,
    });

    powerPlantId = powerPlant._id.toString();
    userId = adminId;

    communityId = (
      await communitiesRepository.create({
        name: faker.name.firstName(),
        members: [
          {
            powerPlantId: new mongoose.Types.ObjectId(powerPlantId),
            userId: new mongoose.Types.ObjectId(adminId),
          },
        ],
        adminId: adminId,
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

  it('should be defined', async () => {
    expect(communityId).toBeDefined();
  });
  it('should throw no calibration data', async () => {
    let error: Error;
    try {
      await communitiesService.predict(communityId);
    } catch (e) {
      error = e;
    }
    expect(error.message).toEqual('No calibration data');
  });
  it('should return community prediction', async () => {
    await powerPlantsService.calibrate(userId, powerPlantId, { power: 100 });
    const pred = await communitiesService.predict(communityId);
    expect(pred).toBeDefined();
    expect(pred.length).toEqual(1);
    expect(pred[0].power).toEqual(100);
  });
  it('should return community prediction by days', async () => {
    await powerPlantsService.calibrate(userId, powerPlantId, { power: 100 });
    const pred = await communitiesService.predictByDays(communityId);
    expect(pred).toBeDefined();
    expect(pred.length).toEqual(1);
    expect(pred[0]).toEqual(25);
  });
  it('should return community power production', async () => {
    await powerPlantsService.calibrate(userId, powerPlantId, { power: 100 });
    const production = await communitiesService.getCommunityPowerProduction(
      communityId,
    );
    expect(production).toBeDefined();
    expect(production.powerPlants.length).toEqual(1);
    expect(production.production).toEqual(100);
  });
});
