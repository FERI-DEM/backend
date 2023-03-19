import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class EstimatedActuals {
  @Prop({ type: Number })
  ghi: number;
  @Prop({ type: Number })
  dni: number;
  @Prop({ type: Number })
  dhi: number;
  @Prop({ type: Number })
  ebh: number;
  @Prop({ type: Number })
  cloud_opacity: number;
  @Prop({ type: String })
  period_end: string;
  @Prop({ type: String })
  period: string;
}

@Schema({ timestamps: true, collection: 'solar-radiation' })
export class SolarRadiation {
  @Prop({ type: Array })
  forecasts: EstimatedActuals[];
  @Prop({ type: Number })
  latitude: number;
  @Prop({ type: Number })
  longitude: number;
}

export type SolarRadiationDocument = SolarRadiation & Document;
export const SolarRadiationSchema =
  SchemaFactory.createForClass(SolarRadiation);
