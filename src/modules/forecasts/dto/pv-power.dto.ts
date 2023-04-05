import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PvPowerDto {
  @ApiProperty({ required: true, description: 'Latitude of location' })
  @IsLatitude()
  @Type(() => Number)
  public lat: number;

  @ApiProperty({ required: true, description: 'Longitude of location' })
  @IsLongitude()
  @Type(() => Number)
  public lon: number;

  @ApiProperty({
    required: true,
    description: 'Solar plane declination, 0 = horizontal, 90 = vertical',
  })
  @IsNumber()
  @Min(0)
  @Max(90)
  @Type(() => Number)
  public dec: number;

  @ApiProperty({
    required: true,
    description: 'Solar plane azimuth, West = 90, South = 0, East = -90',
  })
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  public az: number;

  @ApiProperty({
    required: true,
    description: 'Solar plane max. peak power in kilo watt',
  })
  @IsNumber()
  @Type(() => Number)
  public kwp: number;
}
