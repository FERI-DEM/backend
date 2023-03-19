import { IsLatitude, IsLongitude, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePowerPlantDto {
  @ApiProperty()
  @IsLongitude()
  longitude: number;

  @ApiProperty()
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @IsString()
  displayName: string;
}
