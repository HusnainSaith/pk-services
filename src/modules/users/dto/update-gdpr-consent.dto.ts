import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGdprConsentDto {
  @ApiProperty({ description: 'Marketing consent' })
  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;

  @ApiProperty({ description: 'Analytics consent' })
  @IsBoolean()
  @IsOptional()
  analyticsConsent?: boolean;

  @ApiProperty({ description: 'Data processing consent' })
  @IsBoolean()
  @IsOptional()
  dataProcessingConsent?: boolean;

  @ApiProperty({ description: 'Consent notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}