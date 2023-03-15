import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  readonly firstname: string;

  @ApiProperty()
  @IsString()
  readonly lastname: string;

  @ApiProperty()
  @IsString()
  readonly email: string;
}
