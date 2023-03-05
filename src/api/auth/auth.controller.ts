import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards';
import { User } from '../../common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'luka.pavlic@mail.com',
        },
        password: {
          type: 'string',
          example: '123456',
        },
      },
    },
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@User() user) {
    return this.authService.login(user);
  }
}
