import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReuploadDocumentDto {
  @ApiProperty({ description: 'Reason for reupload' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
