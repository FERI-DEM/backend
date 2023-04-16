import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Member {
  @Prop({ type: String, required: true })
  powerPlantId: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  powerPlantName: string;
}

export type MemberDocument = Member & Document;
export const MemberSchema = SchemaFactory.createForClass(Member);
