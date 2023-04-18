import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ _id: false })
export class Member {
  @Prop({ type: mongoose.Types.ObjectId, required: true })
  powerPlantId: string;

  @Prop({ type: mongoose.Types.ObjectId, required: true })
  userId: string;
}

export type MemberDocument = Member & Document;
export const MemberSchema = SchemaFactory.createForClass(Member);
