import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CreatePowerPlantDto, UpdatePowerPlantDto } from '../dto';
import { Model } from 'mongoose';
import { Calibration } from '../types';

@Injectable()
export class PowerPlantRepository {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}

  async createPowerPlant(userId: string, data: CreatePowerPlantDto) {
    return this.model.findOneAndUpdate(
      { _id: userId },
      { $push: { powerPlants: data } },
      { new: true },
    );
  }

  async initializeCalibration(
    userId: string,
    powerPlantId: string,
    data: { date: string; value: number }[],
  ) {
    return this.model.findOneAndUpdate(
      { _id: userId, 'powerPlants._id': powerPlantId },
      { $set: { 'powerPlants.$.calibration': [] } },
      { new: true },
    );
  }

  async createCalibration(userId: string, powerPlantId, data: Calibration) {
    return this.model.findOneAndUpdate(
      { _id: userId, 'powerPlants._id': powerPlantId },
      { $push: { 'powerPlants.$.calibration': data } },
      { new: true },
    );
  }

  async deletePowerPlant(userId: string, powerPlantId: string) {
    return this.model.findOneAndUpdate(
      { _id: userId },
      { $pull: { powerPlants: { _id: powerPlantId } } },
      { projection: { powerPlants: 1 }, new: true },
    );
  }

  async findPowerPlantById(userId: string, powerPlantId: string) {
    return this.model.findOne(
      { _id: userId, 'powerPlants._id': powerPlantId },
      { 'powerPlants.$': 1 },
    );
  }

  async findPowerPlantByUserId(userId: string) {
    return this.model.findOne({ _id: userId }, { powerPlants: 1 });
  }

  async updatePowerPlant(
    userId: string,
    powerPlantId: string,
    data: UpdatePowerPlantDto,
  ) {
    const { latitude, longitude, displayName } = data;
    return this.model.findOneAndUpdate(
      {
        _id: userId,
        'powerPlants._id': powerPlantId,
      },
      {
        $set: {
          'powerPlants.$.displayName': displayName,
          'powerPlants.$.latitude': latitude,
          'powerPlants.$.longitude': longitude,
        },
      },
      { projection: { powerPlants: 1 }, new: true },
    );
  }

  async findAll() {
    return this.model.find({}, { powerPlants: 1 });
  }
}
