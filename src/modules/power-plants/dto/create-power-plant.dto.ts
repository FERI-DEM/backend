import { IsLatitude, IsLongitude, IsNumber, IsString } from 'class-validator';
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

  @ApiProperty()
  @IsNumber()
  maxPower: number;

  @ApiProperty()
  @IsNumber()
  size: number;
}
