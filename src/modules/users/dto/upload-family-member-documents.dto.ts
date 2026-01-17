import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFamilyMemberDocumentsDto {
  @ApiProperty({ description: 'Service request ID' })
  @IsUUID(4, { message: 'Service request ID must be a valid UUID' })
  serviceRequestId: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Identity Document',
  })
  @IsOptional()
  identityDocument?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Fiscal Code',
  })
  @IsOptional()
  fiscalCode?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Birth Certificate',
  })
  @IsOptional()
  birthCertificate?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Marriage Certificate',
  })
  @IsOptional()
  marriageCertificate?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Dependency Documents',
  })
  @IsOptional()
  dependencyDocuments?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Disability Certificates',
  })
  @IsOptional()
  disabilityCertificates?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Student Enrollment',
  })
  @IsOptional()
  studentEnrollment?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Income Documents',
  })
  @IsOptional()
  incomeDocuments?: any;
}
