import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true, collection: 'power-plants' })
export class PowerPlant {
  @Prop({ type: String })
  latitude: string;
  @Prop({ type: String })
  longitude: string;

  @Prop({ type: String })
  ownerId: string;

  // @Prop({ type: [mongoose.Types.ObjectId], ref: 'User' })
  // owner: User;

  @Prop({ type: Number })
  coefficient: number;

  @Prop({ type: Number })
  predictedPowerProduction: number;
}

export type PowerPlantDocument = PowerPlant & Document;
export const PowerPlantSchema = SchemaFactory.createForClass(PowerPlant);
