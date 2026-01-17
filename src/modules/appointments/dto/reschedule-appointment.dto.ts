import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty()
  @IsDateString()
  newDateTime: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateAppointmentAdminDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsDateString()
  dateTime: string;

  @ApiProperty()
  @IsString()
  serviceType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  operatorId?: string;
}

export class AssignOperatorDto {
  @ApiProperty()
  @IsString()
  operatorId: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  })
  @IsString()
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTimeSlotsDto {
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsString()
  operatorId: string;

  @ApiProperty({ type: [String] })
  timeSlots: string[];
}
