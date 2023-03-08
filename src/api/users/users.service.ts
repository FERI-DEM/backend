import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './schemas/user.schema';
import { hash } from '../../common/utils';
import { Role } from '../../common/types';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<UserDocument> {
    return await this.userRepository.find({ email });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(data: CreateUserDto) {
    const { password } = data;
    const hashedPassword = await hash(password);
    return await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async changeRole(id: string, role: Role) {
    return await this.userRepository.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          role: role,
        },
      },
    );
  }
}
