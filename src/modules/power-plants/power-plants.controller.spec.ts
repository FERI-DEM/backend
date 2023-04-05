import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { PowerPlantsController } from './power-plants.controller';
import { PowerPlantsService } from './power-plants.service';
import { faker } from '@faker-js/faker';
import { PowerPlantsModule } from './power-plants.module';
import { MongooseModule } from '@nestjs/mongoose';
import settings from '../../app.settings';
import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../auth/auth.module';

describe('power-plants controller test', () => {
  let moduleRef: TestingModuleBuilder,
    app: TestingModule,
    controller: PowerPlantsController;

  const powerPlantData = {
    id: faker.database.mongodbObjectId(),
    powerPlants: [],
  };

  const userId = faker.database.mongodbObjectId().toString();

  const createPowerPlantDto = {
    displayName: faker.name.firstName(),
    latitude: Number(faker.address.latitude()),
    longitude: Number(faker.address.longitude()),
  };

  const powerPlantServiceMock = {
    create: jest.fn().mockResolvedValue(powerPlantData),
    findByUser: jest.fn().mockResolvedValue(powerPlantData),
    findById: jest.fn().mockResolvedValue(powerPlantData),
    update: jest.fn().mockResolvedValue(powerPlantData),
    calibrate: jest.fn().mockResolvedValue(powerPlantData),
    predict: jest.fn().mockResolvedValue([{ date: new Date(), power: 100 }]),
  } as jest.Mocked<
    Pick<
      PowerPlantsService,
      'create' | 'findByUser' | 'findById' | 'update' | 'calibrate' | 'predict'
    >
  >;

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [
        AuthModule,
        PowerPlantsModule,
        MongooseModule.forRoot(settings.database.uri),
      ],
    })
      .overrideProvider(PowerPlantsService)
      .useValue(powerPlantServiceMock);

    app = await moduleRef.compile();
    controller = app.get(PowerPlantsController);
  });

  afterAll(async () => {
    if (app) {
      app.flushLogs();
      await app.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(app).toBeDefined();
    expect(moduleRef).toBeDefined();
  });

  it('should create a power plant', async () => {
    const result = await controller.create(createPowerPlantDto, userId);
    expect(result).toEqual(powerPlantData);
    expect(powerPlantServiceMock.create).toBeCalled();
  });

  it('should find a power plant by user', async () => {
    const result = await controller.findAll(userId);
    expect(result).toEqual(powerPlantData);
    expect(powerPlantServiceMock.findByUser).toBeCalled();
  });

  it('should update a power plant', async () => {
    const result = await controller.update(
      powerPlantData.id,
      createPowerPlantDto,
      userId,
    );
    expect(result).toEqual(powerPlantData);
    expect(powerPlantServiceMock.update).toBeCalled();
  });

  it('should calibrate a power plant', async () => {
    const result = await controller.calibrate(
      powerPlantData.id,
      {
        power: 100,
      },
      userId,
    );
    expect(result).toEqual(powerPlantData);
    expect(powerPlantServiceMock.calibrate).toBeCalled();
  });

  it('should predict a power plant', async () => {
    const result = await controller.predict(powerPlantData.id, userId);
    expect(result.length).toBeGreaterThan(0);
    expect(powerPlantServiceMock.predict).toBeCalled();
  });
});
