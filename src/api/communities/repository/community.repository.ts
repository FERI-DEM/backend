import { Injectable } from '@nestjs/common';
import { Community, CommunityDocument } from '../schemas/community.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { EntityRepository } from '../../../common/repository/entity.repository';

@Injectable()
export class CommunityRepository extends EntityRepository<CommunityDocument> {
  constructor(
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
  ) {
    super(communityModel);
  }

  async findAll(
    filterQuery: FilterQuery<CommunityDocument>,
  ): Promise<CommunityDocument[]> {
    return await this.communityModel.find(filterQuery).exec();
  }
}
