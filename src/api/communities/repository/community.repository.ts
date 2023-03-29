import { Injectable } from '@nestjs/common';
import { Community, CommunityDocument } from '../schemas/community.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from '@/common/repository/entity.repository';

@Injectable()
export class CommunityRepository extends EntityRepository<CommunityDocument> {
  constructor(
    @InjectModel(Community.name)
    private readonly organizationModel: Model<CommunityDocument>,
  ) {
    super(organizationModel);
  }
}
