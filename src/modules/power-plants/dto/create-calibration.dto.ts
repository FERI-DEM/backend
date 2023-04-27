import { IsDateString, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCalibrationDto {
  @ApiProperty({
    required: false,
  })
  @ApiProperty()
  @IsPositive()
  power: number;
}
