import { Injectable } from '@nestjs/common';
import { User, UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { EntityRepository } from '../../../common/repository/entity.repository';
import { Model } from 'mongoose';

@Injectable()
export class UserRepository extends EntityRepository<UserDocument> {
  constructor(
    @InjectModel(User.name)
    entityModel: Model<UserDocument>,
  ) {
    super(entityModel);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.entityModel.findOne({ email }).exec();
  }
}
