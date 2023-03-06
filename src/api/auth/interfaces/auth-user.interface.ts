import { ObjectId } from 'mongoose';

export interface AuthUser {
  _id: ObjectId;
  firstname: string;
  lastname: string;
  email: string;
}
