import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsArray()
  powerPlants: { powerPlantId: string }[];
}
