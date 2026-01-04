import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AccountDeletionRequestDto {
  @ApiProperty({ description: 'Reason for deletion' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Additional comments' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiProperty({ description: 'Confirmation text' })
  @IsString()
  confirmation: string;
}