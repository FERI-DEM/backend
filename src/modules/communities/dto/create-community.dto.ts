import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty()
  @IsString()
  name: string;
}
