import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CreatePowerPlantDto, UpdatePowerPlantDto } from '../dto';
import { Model } from 'mongoose';
import { Calibration } from '../types';

// TODO: findOneAndUpdate returns the old document, not the new one
@Injectable()
export class PowerPlantRepository {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}

  async createPowerPlant(userId: string, data: CreatePowerPlantDto) {
    return await this.model.findOneAndUpdate(
      { _id: userId },
      { $push: { powerPlants: data } },
    );
  }

  async createCalibration(userId: string, powerPlantId, data: Calibration) {
    return await this.model.findOneAndUpdate(
      { _id: userId, 'powerPlants._id': powerPlantId },
      { $push: { 'powerPlants.$.calibration': data } },
      { projection: { 'powerPlants.$': 1 } },
    );
  }

  async savePredictedProduction(
    userId: string,
    powerPlantId: string,
    predictedValues: {
      date: string;
      power: number;
    }[],
  ) {
    return await this.model.findOneAndUpdate(
      { _id: userId, 'powerPlants._id': powerPlantId },
      { $set: { 'powerPlants.$.production': predictedValues } },
      { projection: { 'powerPlants.$': 1 } },
    );
  }

  async deletePowerPlant(userId: string, powerPlantId: string) {
    return await this.model.findOneAndUpdate(
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
    data: UpdatePowerPlantDto,
  ) {
    const { latitude, longitude, displayName } = data;
    return await this.model.findOneAndUpdate(
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
      { projection: { powerPlants: 1 } },
    );
  }
}
