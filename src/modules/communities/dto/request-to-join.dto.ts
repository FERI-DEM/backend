import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class RequestToJoinDto {
  @ApiProperty()
  @IsString()
  communityId: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  powerPlants: string[];
}
