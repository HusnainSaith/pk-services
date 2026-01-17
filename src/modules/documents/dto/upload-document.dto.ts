import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Document file',
  })
  file: any;

  @ApiProperty({ description: 'Service request ID', name: 'serviceRequestId' })
  @IsString()
  serviceRequestId: string;

  @ApiProperty({ description: 'Document type', name: 'documentType' })
  @IsString()
  documentType: string;

  @ApiProperty({ required: false, description: 'Document description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDocumentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ApproveDocumentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectDocumentDto {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddNotesDto {
  @ApiProperty()
  @IsString()
  notes: string;
}
