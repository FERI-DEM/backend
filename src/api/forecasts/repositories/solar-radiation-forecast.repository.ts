import { Injectable } from '@nestjs/common';
import { SolarRadiation, SolarRadiationDocument } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { EntityRepository } from '@/common/repository/entity.repository';
import { Model } from 'mongoose';

@Injectable()
export class SolarRadiationForecastRepository extends EntityRepository<SolarRadiationDocument> {
  constructor(
    @InjectModel(SolarRadiation.name)
    entityModel: Model<SolarRadiationDocument>,
  ) {
    super(entityModel);
  }
}
