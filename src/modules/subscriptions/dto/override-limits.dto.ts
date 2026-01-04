import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OverrideLimitsDto {
  @ApiProperty({ description: 'New service request limit' })
  @IsNumber()
  @IsOptional()
  serviceRequestLimit?: number;

  @ApiProperty({ description: 'New document upload limit' })
  @IsNumber()
  @IsOptional()
  documentUploadLimit?: number;

  @ApiProperty({ description: 'New appointment limit' })
  @IsNumber()
  @IsOptional()
  appointmentLimit?: number;

  @ApiProperty({ description: 'Reason for override' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Override duration in days' })
  @IsNumber()
  @IsOptional()
  durationDays?: number;
}