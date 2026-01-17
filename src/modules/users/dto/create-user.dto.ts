import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  Matches,
  IsBoolean,
  IsDateString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'mario.rossi@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description:
      'Password (must contain at least 1 uppercase, 1 lowercase, and 1 number)',
    example: 'SecurePass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
  })
  password: string;

  @ApiProperty({
    description: 'Full name of the user (letters and spaces only)',
    example: 'Mario Rossi',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-Z\u00c0-\u00ff\s']+$/, {
    message: 'Full name can only contain letters, spaces and apostrophes',
  })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Italian fiscal code (16 characters)',
    example: 'RSSMRA85M01H501Z',
  })
  @IsOptional()
  @IsString({ message: 'Fiscal code must be a string' })
  @Length(16, 16, { message: 'Fiscal code must be exactly 16 characters' })
  @Matches(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/, {
    message: 'Invalid fiscal code format',
  })
  fiscalCode?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+39 333 1234567',
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone cannot exceed 20 characters' })
  @Matches(/^\+?[0-9\s\-\(\)]+$/, {
    message: 'Phone must be a valid phone number format',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1985-08-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Birth place',
    example: 'Milano',
  })
  @IsOptional()
  @IsString({ message: 'Birth place must be a string' })
  @MaxLength(100, { message: 'Birth place cannot exceed 100 characters' })
  birthPlace?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: 'Via Roma 123',
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(255, { message: 'Address cannot exceed 255 characters' })
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Milano',
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @MaxLength(100, { message: 'City cannot exceed 100 characters' })
  city?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '20100',
  })
  @IsOptional()
  @IsString({ message: 'Postal code must be a string' })
  @MaxLength(10, { message: 'Postal code cannot exceed 10 characters' })
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Province (2 letter code)',
    example: 'MI',
  })
  @IsOptional()
  @IsString({ message: 'Province must be a string' })
  @Length(2, 2, { message: 'Province must be exactly 2 characters' })
  province?: string;

  @ApiPropertyOptional({
    description: 'GDPR consent',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'GDPR consent must be a boolean' })
  gdprConsent?: boolean;

  @ApiPropertyOptional({
    description: 'Marketing consent',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Marketing consent must be a boolean' })
  privacyConsent?: boolean;

  @ApiPropertyOptional({
    description: 'Is user active',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active status must be a boolean' })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Role ID (must be a valid UUID v4)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Role ID must be a valid UUID' })
  roleId?: string;
}
