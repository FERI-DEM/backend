import { IsDateString, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCalibrationDto {
  @ApiProperty()
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty()
  @IsPositive()
  power: number;
}
