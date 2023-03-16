import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Model } from 'mongoose';
import { CreatePowerPlantDto } from '../dto/create-power-plant.dto';

@Injectable()
export class PowerPlantRepository {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}

  async createPowerPlant(userId: string, data: CreatePowerPlantDto) {
    return await this.model.updateOne(
      { _id: userId },
      { $push: { powerPlants: data } },
    );
  }

  async deletePowerPlant(userId: string, powerPlantId: string) {
    return await this.model.updateOne(
      { _id: userId },
      { $pull: { powerPlants: { _id: powerPlantId } } },
    );
  }

  async findPowerPlantById(userId: string, powerPlantId: string) {
    return await this.model.findOne(
      { _id: userId, 'powerPlants._id': powerPlantId },
      { 'powerPlants.$': 1 },
    );
  }

  async findPowerPlantByUserId(userId: string) {
    return await this.model.findOne({ _id: userId }, { powerPlants: 1 });
  }

  async updatePowerPlant(
    userId: string,
    powerPlantId: string,
    data: CreatePowerPlantDto,
  ) {
    return await this.model.updateOne(
      { _id: userId, 'powerPlants._id': powerPlantId },
      { $set: { 'powerPlants.$': data } },
    );
  }
}
