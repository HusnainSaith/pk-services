import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePriorityDto {
  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority: string;
}
