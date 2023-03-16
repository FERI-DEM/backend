import { Prop, raw } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export class PowerPlant {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: String })
  latitude: string;

  @Prop({ type: String })
  longitude: string;

  @Prop({ type: Number })
  coefficient: number;

  @Prop({ type: Number })
  predictedProduction: number;

  @Prop(
    raw({
      date: { type: String },
      power: { type: Number },
    }),
  )
  production: { date: string; power: number }[];
}
