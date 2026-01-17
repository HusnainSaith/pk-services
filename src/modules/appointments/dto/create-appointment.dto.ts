import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiPropertyOptional({ description: 'Service type ID' })
  @IsOptional()
  @IsUUID(4, { message: 'Service type ID must be a valid UUID' })
  serviceTypeId?: string;

  @ApiPropertyOptional({ description: 'Preferred operator ID' })
  @IsOptional()
  @IsUUID(4, { message: 'Operator ID must be a valid UUID' })
  operatorId?: string;

  @ApiProperty({
    description: 'Appointment title',
    example: 'ISEE Consultation',
  })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title: string;

  @ApiPropertyOptional({ description: 'Appointment description' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Appointment date and time',
    example: '2024-01-15T10:00:00.000Z',
  })
  @IsDateString(
    {},
    { message: 'Appointment date must be a valid ISO date string' },
  )
  appointmentDate: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    default: 60,
    enum: [30, 60, 90],
  })
  @IsOptional()
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(30, { message: 'Duration must be at least 30 minutes' })
  @Max(90, { message: 'Duration cannot exceed 90 minutes' })
  durationMinutes?: number = 60;

  @ApiPropertyOptional({ description: 'Appointment location' })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(255, { message: 'Location cannot exceed 255 characters' })
  location?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
