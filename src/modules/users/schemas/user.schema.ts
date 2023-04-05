import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../../common/types';
import {
  PowerPlant,
  PowerPlantSchema,
} from '../../power-plants/schemas/power-plant.schema';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  /**
   * @userId: The user's Firebase UID
   */
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({
    type: [String],
    default: [Role.BASIC_USER],
    enum: Object.values(Role),
  })
  roles: Role[];

  @Prop({ type: [PowerPlantSchema], default: [] })
  powerPlants: PowerPlant[];
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
