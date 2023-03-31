import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';
import settings from '../../app.settings';
import { Env } from '../constants/env.constants';

export abstract class EntityRepository<T extends Document> {
  protected constructor(protected readonly entityModel: Model<T>) {}

  async find(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, unknown>,
  ): Promise<T | null> {
    return this.entityModel
      .findOne(entityFilterQuery, {
        __v: 0,
        ...projection,
      })
      .exec();
  }

  async findOne(entityFilterQuery: FilterQuery<T>): Promise<T | null> {
    return await this.entityModel.findOne(entityFilterQuery).exec();
  }

  async findById(id: string): Promise<T | null> {
    return await this.entityModel.findById(id).exec();
  }

  async findAll(entityFilterQuery: FilterQuery<T>): Promise<T[]> {
    return await this.entityModel.find(entityFilterQuery).exec();
  }

  async create(createEntityData: unknown): Promise<T> {
    const entity = new this.entityModel(createEntityData);
    return entity.save();
  }

  async findOneAndUpdate(
    entityFilterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<unknown>,
  ): Promise<T | null> {
    return this.entityModel.findOneAndUpdate(
      entityFilterQuery,
      updateEntityData,
      {
        new: true,
      },
    );
  }

  async findOneAndDelete(entityFilterQuery: FilterQuery<T>): Promise<T | null> {
    return this.entityModel.findOneAndDelete(entityFilterQuery);
  }

  async deleteMany(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = await this.entityModel.deleteMany(entityFilterQuery);
    return deleteResult.deletedCount >= 1;
  }

  async dropCollection(): Promise<boolean> {
    if (settings.environment !== Env.TEST) {
      throw new Error('Cannot drop collection outside of test environment');
    }
    return await this.entityModel.collection.drop();
  }

  async deleteAll() {
    if (settings.environment !== Env.TEST) {
      throw new Error(
        'Cannot delete all documents outside of test environment',
      );
    }
    return this.entityModel.deleteMany({});
  }
}
