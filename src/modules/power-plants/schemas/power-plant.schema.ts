import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ collection: 'power-plants' })
export class PowerPlant {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  displayName: string;

  @Prop({ type: Number })
  latitude: number;

  @Prop({ type: Number })
  longitude: number;

  @Prop({ type: Number })
  maxPower: number;

  @Prop({ type: Number })
  size: number;

  @Prop({ type: Array, default: [] })
  calibration: { date: string; value: number }[];
}

export type PowerPlantDocument = PowerPlant & mongoose.Document;
export const PowerPlantSchema = SchemaFactory.createForClass(PowerPlant);
