import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddMemberDto {
  @ApiProperty()
  @IsString()
  memberId: string;
}
