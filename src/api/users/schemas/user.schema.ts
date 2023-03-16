import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../../common/types';
import { PowerPlant } from '../../power-plants/schemas/power-plant.schema';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ type: String, required: true })
  firstname: string;

  @Prop({ type: String, required: true })
  lastname: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({
    type: String,
    default: Role.BASIC_USER,
    enum: Object.values(Role),
  })
  role: Role;

  @Prop({ type: Array, default: [] })
  powerPlants: PowerPlant[];
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
