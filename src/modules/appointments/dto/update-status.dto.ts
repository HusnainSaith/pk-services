import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({ description: 'New status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Status change reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}
