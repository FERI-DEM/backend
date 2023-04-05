import { Role } from './role.types';

export interface RequestUser {
  id: string;
  email: string;
  userId: string;
  roles: Role[];
}
