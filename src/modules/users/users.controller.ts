import {
  Controller,
  Get,
  HttpException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from '../../common/decorators';
import { AuthGuard } from '../auth/guards';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(@User() user: any) {
    return user;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      return await this.usersService.findById(id);
    } catch (e) {
      throw new HttpException(e.message, 404);
    }
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
  }
}
