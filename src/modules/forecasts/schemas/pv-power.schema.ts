import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class Result {
  @Prop({ type: Object })
  watts: Record<string, number>;
  @Prop({ type: Object })
  watt_hours_period: Record<string, number>;
  @Prop({ type: Object })
  watt_hours: Record<string, number>;
  @Prop({ type: Object })
  watt_hours_day: Record<string, number>;
}

class Info {
  @Prop({ type: Number })
  latitude: number;
  @Prop({ type: Number })
  longitude: number;
  @Prop({ type: Number })
  distance: number;
  @Prop(String)
  place: string;
  @Prop(String)
  timezone: string;
  @Prop(String)
  time: string;
  @Prop(String)
  time_utc: string;
}

class Message {
  @Prop({ type: Number })
  code: number;
  @Prop(String)
  type: string;
  @Prop(String)
  text: string;
  @Prop({ type: Info })
  info: Info;
}

@Schema({ timestamps: true, collection: 'power-forecasts' })
export class PVPowerForecast {
  @Prop({ type: Result })
  result: Result;

  @Prop({ type: Message })
  message: Message;

  @Prop({ type: String })
  createdAt?: string;
}

export type PVPowerForecastDocument = PVPowerForecast & Document;
export const PVPowerForecastSchema =
  SchemaFactory.createForClass(PVPowerForecast);
