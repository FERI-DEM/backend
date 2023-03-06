import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards';
import { User } from '../../common/decorators';
import { RegisterDto } from './dto/register.dto';

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
  @Post('local/login')
  async login(@User() user) {
    return await this.authService.login(user);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }
}
