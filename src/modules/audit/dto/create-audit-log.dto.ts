import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  action: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  resourceType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  oldValues?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  newValues?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
