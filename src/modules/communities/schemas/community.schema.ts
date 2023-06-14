import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Member, MemberSchema } from './member.schema';

@Schema({ timestamps: true, collection: 'communities' })
export class Community {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: [MemberSchema], default: [] })
  members: Member[];

  @Prop({ type: String, required: true })
  adminId: string;
}

export type CommunityDocument = Community & Document;
export const CommunitySchema = SchemaFactory.createForClass(Community);
