import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateExtendedProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fiscalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birthPlace?: string;
}

export class UpdateGdprConsentDto {
  @ApiPropertyOptional()
  @IsOptional()
  gdprConsent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  privacyConsent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  marketingConsent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  analyticsConsent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  thirdPartyConsent?: boolean;
}

export class AccountDeletionRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;
}
