import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { UserRepository } from '../users/repositories/user.repository';
import { PowerPlantsService } from './power-plants.service';
import { faker } from '@faker-js/faker';
import { CreateCalibrationDto, CreatePowerPlantDto } from './dto';
import settings from '../../app.settings';
import { MongooseModule } from '@nestjs/mongoose';
import { PowerPlantsModule } from './power-plants.module';
import { Role } from '../../common/types';

describe('power-plants service test', () => {
  let moduleRef: TestingModuleBuilder,
    app: TestingModule,
    powerPlantsService: PowerPlantsService,
    userService: UsersService,
    userRepository: UserRepository,
    userId: string;

  const calibrationData: CreateCalibrationDto = {
    power: 100,
  };

  const powerPlantData: CreatePowerPlantDto = {
    displayName: faker.name.firstName(),
    latitude: Number(faker.address.latitude()),
    longitude: Number(faker.address.longitude()),
  };

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [
        PowerPlantsModule,
        MongooseModule.forRoot(settings.database.uri),
      ],
    });
    app = await moduleRef.compile();
    userService = app.get(UsersService);
    userRepository = app.get(UserRepository);
    powerPlantsService = app.get(PowerPlantsService);
  });

  beforeEach(async () => {
    userId = (
      await userService.create({
        firstname: 'test',
        lastname: 'test',
        email: 'test',
      })
    ).id;
  });

  afterAll(async () => {
    await userRepository.dropCollection();
    if (app) {
      app.flushLogs();
      await app.close();
    }
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
    const { role: roleBefore } = await userService.findById(userId);
    const result = await powerPlantsService.create(userId, powerPlantData);
    const { role: roleAfter } = await userService.findById(userId);
    expect(roleBefore).toBe(Role.BASIC_USER);
    expect(roleAfter).toBe(Role.POWER_PLANT_OWNER);
    expect(result.powerPlants.length).toBe(1);
  });

  it('should delete power plant', async () => {
    const user = await powerPlantsService.create(userId, powerPlantData);
    const powerPlantId = user.powerPlants[0]._id.toString();
    const result2 = await powerPlantsService.delete(userId, powerPlantId);
    const { role: roleAfter } = await userService.findById(userId);
    expect(roleAfter).toBe(Role.BASIC_USER);
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
    const user = await powerPlantsService.create(userId, powerPlantData);
    const powerPlantId = user.powerPlants[0]._id.toString();
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
    const user = await powerPlantsService.create(userId, powerPlantData);
    const result = await powerPlantsService.findByUser(user._id.toString());
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
    const user = await powerPlantsService.create(userId, powerPlantData);
    const powerPlantId = user.powerPlants[0]._id.toString();
    const result = await powerPlantsService.update(userId, powerPlantId, {
      displayName: 'test1',
    });
    expect(result.powerPlants[0].displayName).toBe('test1');
  });
});

// TODO: add test for calibration and prediction
