import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<UserDocument> {
    return await this.userRepository.findByEmail(email);
  }

  async create(data: CreateUserDto) {
    return await this.userRepository.create(data);
  }
}
