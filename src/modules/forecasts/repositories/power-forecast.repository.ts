import { Injectable } from '@nestjs/common';

import { PVPowerForecast, PVPowerForecastDocument } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from '../../../common/repository/entity.repository';

@Injectable()
export class PowerForecastRepository extends EntityRepository<PVPowerForecastDocument> {
  constructor(
    @InjectModel(PVPowerForecast.name)
    entityModel: Model<PVPowerForecastDocument>,
  ) {
    super(entityModel);
  }
}
