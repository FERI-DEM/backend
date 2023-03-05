import { Injectable } from '@nestjs/common';
import { EntityRepository } from '../../../common/repository/entity.repository';
import {
  PVPowerForecast,
  PVPowerForecastDocument,
} from '../schemas/pv-power.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PowerForecastRepository extends EntityRepository<PVPowerForecastDocument> {
  constructor(
    @InjectModel(PVPowerForecast.name)
    entityModel: Model<PVPowerForecastDocument>,
  ) {
    super(entityModel);
  }
}
