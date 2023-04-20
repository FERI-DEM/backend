import { Injectable } from '@nestjs/common';
import { Community, CommunityDocument } from '../schemas/community.schema';
import { Community as CommunityType } from '../types/community.types';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model } from 'mongoose';
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

  async findByIdWithLookup(id: string): Promise<CommunityType[]> {
    return await this.communityModel
      .aggregate<CommunityType>([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        { $unwind: '$members' },
        {
          $lookup: {
            from: 'users',
            localField: 'members.userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'users',
            let: { powerPlantId: '$members.powerPlantId' },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ['$$powerPlantId', '$powerPlants._id'] },
                },
              },
              { $unwind: '$powerPlants' },
              {
                $match: {
                  $expr: { $eq: ['$powerPlants._id', '$$powerPlantId'] },
                },
              },
            ],
            as: 'powerPlant',
          },
        },
        { $unwind: '$powerPlant' },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            members: {
              $push: {
                userId: '$user._id',
                userName: {
                  $arrayElemAt: [{ $split: ['$user.email', '@'] }, 0],
                },
                powerPlantId: '$powerPlant.powerPlants._id',
                powerPlantName: '$powerPlant.powerPlants.displayName',
              },
            },
          },
        },
      ])
      .exec();
  }
}
