import { Test } from '@nestjs/testing';
import { ForecastsController } from './forecasts.controller';

import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('ForecastsController', () => {
  let controller: ForecastsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ForecastsController],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(ForecastsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
