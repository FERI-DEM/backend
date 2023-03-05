import { Test } from '@nestjs/testing';
import { ForecastsService } from './forecasts.service';

import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('ForecastsService', () => {
  let service: ForecastsService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ForecastsService],
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
    service = moduleRef.get(ForecastsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
