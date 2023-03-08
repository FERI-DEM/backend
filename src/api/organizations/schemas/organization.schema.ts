import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User as Member } from '../../users/schemas/user.schema';

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: [String] })
  membersIds: string[];

  @Prop({ type: [mongoose.Types.ObjectId], ref: 'User' })
  members: Member[];

  @Prop({ type: String, required: true })
  adminId: string;
}

export type OrganizationDocument = Organization & Document;
export const OrganizationSchema = SchemaFactory.createForClass(Organization);
