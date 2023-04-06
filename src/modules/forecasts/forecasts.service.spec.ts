import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { ForecastsService } from './forecasts.service';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import settings from '../../app.settings';
import { HttpService } from '@nestjs/axios';
import { ForecastsModule } from './forecasts.module';
import { SolarRadiationForecastRepository } from './repositories';
import { AxiosResponse } from 'axios';

describe('ForecastsService test', () => {
  let moduleRef: TestingModuleBuilder,
    app: TestingModule,
    forecastsService: ForecastsService,
    solarRep: SolarRadiationForecastRepository;

  const httpServiceMock = {
    axiosRef: {
      get: jest.fn().mockImplementation(() => {
        return Promise.resolve({} as AxiosResponse);
      }),
    },
  } as unknown as jest.Mocked<Pick<HttpService, 'axiosRef'>>;

  beforeAll(async () => {
    moduleRef = Test.createTestingModule({
      imports: [
        AuthModule,
        ForecastsModule,
        MongooseModule.forRoot(settings.database.uri),
      ],
    })
      .overrideProvider(HttpService)
      .useValue(httpServiceMock);

    app = await moduleRef.compile();
    forecastsService = app.get(ForecastsService);
    solarRep = app.get(SolarRadiationForecastRepository);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await solarRep.create({
      latitude: 30,
      longitude: 30,
      forecasts: [
        {
          ghi: 319,
          ghi90: 319,
          ghi10: 319,
          ebh: 267,
          dni: 778,
          dni10: 778,
          dni90: 778,
          dhi: 52,
          air_temp: 21,
          zenith: 70,
          azimuth: 71,
          cloud_opacity: 0,
          period_end: '2023-04-05T14:30:00.0000000Z',
          period: 'PT30M',
        },
      ],
    });
  });

  afterEach(async () => {
    await solarRep.deleteAll();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(forecastsService).toBeDefined();
    expect(app).toBeDefined();
    expect(moduleRef).toBeDefined();
  });

  it('should get solar radiation from db', async () => {
    const solarRadiation = await forecastsService.getSolarRadiation({
      lat: 30,
      lon: 30,
    });
    expect(solarRadiation).toHaveProperty('forecasts');
  });

  it('should get solar radiation from api', async () => {
    // calls from api because we do not have data for this location
    await forecastsService.getSolarRadiation({
      lat: 10,
      lon: 10,
    });
    expect(httpServiceMock.axiosRef.get).toBeCalledTimes(1);
  });

  it('should get solar radiation from api and save to db if the data is to old in db', async () => {
    await forecastsService.getSolarRadiation({
      lat: 30,
      lon: 30,
    });
    expect(httpServiceMock.axiosRef.get).toBeCalledTimes(0);

    // forward time to 24 hour
    const date = new Date();
    jest
      .spyOn(Date.prototype, 'setHours')
      .mockReturnValue(date.getHours() + 24);

    await forecastsService.getSolarRadiation({
      lat: 30,
      lon: 30,
    });
    expect(httpServiceMock.axiosRef.get).toBeCalledTimes(1);
  });
});
