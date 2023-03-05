import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ForecastsModule } from '../src/api/forecasts/forecasts.module';
import { ForecastsService } from '../src/api/forecasts/forecasts.service';

describe('Forecasts (e2e)', () => {
  let app: INestApplication;
  let forecastService: ForecastsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ForecastsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    forecastService = moduleFixture.get<ForecastsService>(ForecastsService);
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET weather', () => {
    return request(app.getHttpServer())
      .get('/forecasts/weather/45/17')
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject({
          city: {
            coord: {
              lon: 17,
              lat: 45,
            },
          },
        });
      });
  });

  it('/GET solar-radiation', () => {
    return request(app.getHttpServer())
      .get('/forecasts/solar-radiation/45/17')
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject({
          coord: {
            lon: '17',
            lat: '45',
          },
        });
      });
  });

  it('/GET solar-power', () => {
    jest
      .spyOn(forecastService, 'getPVPower')
      .mockImplementation(() =>
        Promise.resolve({ message: { info: { latitude: 45, longitude: 17 } } }),
      );

    return request(app.getHttpServer())
      .get('/forecasts/pv-power/45/17/12/12/12')
      .then((res) => {
        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject({
          message: {
            info: {
              latitude: 45,
              longitude: 17,
            },
          },
        });
      });
  });
});
