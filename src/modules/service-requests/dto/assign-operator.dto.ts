import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignOperatorDto {
  @ApiProperty()
  @IsString()
  operatorId: string;
}
