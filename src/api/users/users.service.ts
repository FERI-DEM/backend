import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './schemas/user.schema';
import { hash } from '../../common/utils';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<UserDocument> {
    return await this.userRepository.find({ email });
  }

  async create(data: CreateUserDto) {
    const { password } = data;
    const hashedPassword = await hash(password);
    return await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }
}
