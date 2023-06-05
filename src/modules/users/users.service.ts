import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './schemas/user.schema';
import { Role } from '../../common/types';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<UserDocument> {
    return await this.userRepository.findOne({ email });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByFirebaseId(firebaseId: string): Promise<UserDocument> {
    const user = await this.userRepository.findOne({ userId: firebaseId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(data: CreateUserDto): Promise<UserDocument> {
    return await this.userRepository.create(data);
  }

  async addRole(id: string, role: Role): Promise<UserDocument> {
    return await this.userRepository.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $addToSet: {
          roles: role,
        },
      },
    );
  }

  async removeRole(id: string, role: Role): Promise<UserDocument> {
    return await this.userRepository.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $pull: {
          roles: role,
        },
      },
    );
  }
}
