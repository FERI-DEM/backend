import { Role } from '../../common/types';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { PowerPlantsService } from './power-plants.service';
import { UsersService } from '../users/users.service';
import { UserRepository } from '../users/repositories/user.repository';
import { CreatePowerPlantDto } from './dto';
import { faker } from '@faker-js/faker';
import { PowerPlantsModule } from './power-plants.module';
import { MongooseModule } from '@nestjs/mongoose';
import settings from '../../app.settings';
import { AuthModule } from '../auth/auth.module';
import { ForecastsService } from '../forecasts/forecasts.service';
import { FirebaseService } from '../../common/services';
import clearAllMocks = jest.clearAllMocks;
import { OpenMeteoAPI } from '../forecasts/strategies/open-meteo.strategy';
import { HistoricalData } from './utils/cassandra-queries';

describe('power-plants service test', () => {
  let moduleRef: TestingModuleBuilder,
    app: TestingModule,
    powerPlantsService: PowerPlantsService,
    userService: UsersService,
    userRepository: UserRepository,
    firebaseService: FirebaseService,
    userId: string;

  const userMail = faker.internet.email();
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

  const powerPlantData: CreatePowerPlantDto = {
    displayName: faker.name.firstName(),
    latitude: 30,
    longitude: 30,
  };

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [
        AuthModule,
        PowerPlantsModule,
        MongooseModule.forRoot(settings.database.uri),
      ],
    })
      .overrideProvider(OpenMeteoAPI)
      .useValue(forecastServiceMock);

    app = await moduleRef.compile();
    userService = app.get(UsersService);
    userRepository = app.get(UserRepository);
    powerPlantsService = app.get(PowerPlantsService);
    firebaseService = app.get(FirebaseService);

    jest
      .spyOn(firebaseService.auth, 'setCustomUserClaims')
      .mockImplementation(() => Promise.resolve());
  });

  beforeEach(async () => {
    userId = (
      await userService.create({
        userId: faker.datatype.uuid(),
        email: userMail,
      })
    ).id;
  });

  afterAll(async () => {
    await userRepository.dropCollection();
    if (app) {
      app.flushLogs();
      await app.close();
    }
    clearAllMocks();
  });

  afterEach(async () => {
    await userRepository.deleteAll();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(moduleRef).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(userService).toBeDefined();
  });

  it('should create a power plant', async () => {
    const { roles: rolesBefore } = await userService.findById(userId);

    const result = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const { roles: rolesAfter } = await userService.findById(userId);
    expect(rolesBefore[0]).toBe(Role.BASIC_USER);
    expect(rolesAfter[1]).toBe(Role.POWER_PLANT_OWNER);
    expect(result.displayName).toBe(powerPlantData.displayName);
  });

  it('should delete power plant', async () => {
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();
    const result2 = await powerPlantsService.delete(userId, powerPlantId);
    const { roles: rolesAfter } = await userService.findById(userId);
    expect(rolesAfter[0]).toBe(Role.BASIC_USER);
    expect(result2.powerPlants.length).toBe(0);
  });

  it('should fail to delete power plant', async () => {
    try {
      await powerPlantsService.delete(userId, faker.database.mongodbObjectId());
    } catch (e) {
      expect(e.message).toBe('Could not delete power plant');
    }
  });

  it('should find power plant by id', async () => {
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();
    const result = await powerPlantsService.findById(userId, powerPlantId);
    expect(result.powerPlants[0]._id.toString()).toBe(powerPlantId);
  });

  it('should fail to find power plant by id', async () => {
    try {
      await powerPlantsService.findById(
        userId,
        faker.database.mongodbObjectId(),
      );
    } catch (e) {
      expect(e.message).toBe('Power plant not found');
    }
  });

  it('should find power plants by user id', async () => {
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const result = await powerPlantsService.findByUser(userId);
    expect(result.powerPlants.length).toBeGreaterThan(0);
  });

  it('should return null if user does not exist', async () => {
    const result = await powerPlantsService.findByUser(
      faker.database.mongodbObjectId(),
    );
    expect(result).toBe(null);
  });

  it('should return [] if user does not have any power plants', async () => {
    const result = await powerPlantsService.findByUser(userId);
    expect(result.powerPlants).toStrictEqual([]);
  });

  it('should update power plant', async () => {
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();
    const result = await powerPlantsService.update(userId, powerPlantId, {
      displayName: 'test1',
    });
    expect(result.powerPlants[0].displayName).toBe('test1');
  });

  it('should create calibration', async () => {
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();
    const result = await powerPlantsService.calibrate(userId, powerPlantId, {
      power: 100,
    });
    expect(result.powerPlants[0].calibration.length).toBe(1);
    expect(result.powerPlants[0].calibration[0].value).toBe(1);
  });

  it('should fail to create calibration because radiation is 0 or lower', async () => {
    moduleRef.overrideProvider(ForecastsService).useValue({
      getCurrentSolarRadiation: jest.fn().mockResolvedValueOnce({
        solar: 0,
      }),
    });
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();
    try {
      await powerPlantsService.calibrate(userId, powerPlantId, {
        power: 100,
      });
    } catch (e) {
      expect(e.message).toBe(
        'Please calibrate when solar radiation is greater than 0',
      );
    }
  });
  //
  it('should fail to create calibration because power  is 0 or lower', async () => {
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();

    try {
      await powerPlantsService.calibrate(userId, powerPlantId, {
        power: -100,
      });
    } catch (e) {
      expect(e.message).toBe('Power must be greater than 0');
    }
  });

  it('should fail to predict power because user has no calibration data', async () => {
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();
    try {
      await powerPlantsService.predict(powerPlantId);
    } catch (e) {
      expect(e.message).toBe('No calibration data');
    }
  });
  it('should fail to predict if forecast data could not be retrieved', async () => {
    moduleRef.overrideProvider(OpenMeteoAPI).useValue({
      getCurrentSolarRadiation: jest.fn().mockResolvedValue(null),
    });
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();

    await powerPlantsService.calibrate(userId, powerPlantId, {
      power: 100,
    });

    try {
      await powerPlantsService.predict(powerPlantId);
    } catch (e) {
      expect(e.message).toBe('Could not retrieve data for forecasts');
    }
  });
  it('should predict power', async () => {
    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();

    await powerPlantsService.calibrate(userId, powerPlantId, {
      power: 100,
    });

    const result = await powerPlantsService.predict(powerPlantId);
    expect(result[0].power).toBe(100);
  });

  it('should calculate power plant production for this month', async () => {
    jest
      .spyOn(powerPlantsService, 'history')
      .mockResolvedValueOnce([
        { predictedPower: 100 },
        { predictedPower: 100 },
      ] as HistoricalData[]);

    const powerPlant = await powerPlantsService.create(
      userId,
      'test',
      powerPlantData,
    );
    const powerPlantId = powerPlant._id.toString();

    const res = await powerPlantsService.getProduction(powerPlantId);
    expect(res.powerPlantId).toBe(powerPlantId);
    expect(res.production).toBe(200);
    expect(res.email).toBe(userMail);
  });
});
