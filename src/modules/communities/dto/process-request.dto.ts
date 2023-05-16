import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class ProcessRequestDto {
  @ApiProperty()
  @IsString()
  notificationId: string;

  @ApiProperty()
  @IsBoolean()
  accepted: boolean;
}
