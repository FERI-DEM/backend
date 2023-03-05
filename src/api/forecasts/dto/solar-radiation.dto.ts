import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';

export class SolarRadiationDto {
  @ApiProperty({ required: true, description: 'Latitude of location' })
  @IsLatitude()
  @Type(() => Number)
  public lat: number;

  @ApiProperty({ required: true, description: 'Longitude of location' })
  @IsLongitude()
  @Type(() => Number)
  public lon: number;
}
