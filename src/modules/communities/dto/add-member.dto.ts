import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AddMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
