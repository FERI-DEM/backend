import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
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

  @Prop({ type: Number, default: 0 })
  coefficient: number;

  @Prop({ type: Number, default: 0 })
  predictedProduction: number;

  @Prop({
    type: raw({
      date: { type: String },
      power: { type: Number },
    }),
    default: [],
  })
  production: { date: string; power: number }[];

  @Prop({ type: Array, default: [] })
  calibration: { date: string; power: number; radiation: number }[];
}

export type PowerPlantDocument = PowerPlant & mongoose.Document;
export const PowerPlantSchema = SchemaFactory.createForClass(PowerPlant);
