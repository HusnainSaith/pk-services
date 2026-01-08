import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsDate,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FamilyMemberDto {
  @IsString()
  name: string;

  @IsString()
  fiscalCode: string;

  @IsString()
  relationship: string;

  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @IsOptional()
  cohabiting?: boolean;
}

class ResidenceDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  municipality?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  propertyType?: string;
}

class IncomeSourceDto {
  @IsString()
  type: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  year: number;
}

class VehicleDto {
  @IsString()
  licensePlate: string;

  @IsNumber()
  registrationYear: number;

  @IsString()
  type: string;
}

class UniversityStudentDto {
  @IsString()
  name: string;

  @IsString()
  university: string;

  @IsString()
  degree: string;
}

class MinorDto {
  @IsString()
  name: string;

  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @IsString()
  parentalStatus: string;
}

export class CreateIseeRequestDto {
  @IsString()
  serviceTypeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  @IsOptional()
  familyMembers?: FamilyMemberDto[];

  @ValidateNested()
  @Type(() => ResidenceDto)
  @IsOptional()
  residence?: ResidenceDto;

  @IsNumber()
  @IsOptional()
  incomeYear1?: number;

  @IsNumber()
  @IsOptional()
  incomeYear2?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomeSourceDto)
  @IsOptional()
  incomeSources?: IncomeSourceDto[];

  @IsNumber()
  @IsOptional()
  bankAccounts?: number;

  @IsNumber()
  @IsOptional()
  investments?: number;

  @IsObject()
  @IsOptional()
  otherMovableAssets?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleDto)
  @IsOptional()
  vehicles?: VehicleDto[];

  @IsOptional()
  hasDisability?: boolean;

  @IsString()
  @IsOptional()
  disabilityType?: string;

  @IsString()
  @IsOptional()
  disabilityPercentage?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UniversityStudentDto)
  @IsOptional()
  universityStudents?: UniversityStudentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MinorDto)
  @IsOptional()
  minors?: MinorDto[];
}

export class UpdateIseeRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  @IsOptional()
  familyMembers?: FamilyMemberDto[];

  @ValidateNested()
  @Type(() => ResidenceDto)
  @IsOptional()
  residence?: ResidenceDto;

  @IsNumber()
  @IsOptional()
  incomeYear1?: number;

  @IsNumber()
  @IsOptional()
  incomeYear2?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomeSourceDto)
  @IsOptional()
  incomeSources?: IncomeSourceDto[];

  @IsNumber()
  @IsOptional()
  bankAccounts?: number;

  @IsNumber()
  @IsOptional()
  investments?: number;

  @IsObject()
  @IsOptional()
  otherMovableAssets?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleDto)
  @IsOptional()
  vehicles?: VehicleDto[];

  @IsOptional()
  hasDisability?: boolean;

  @IsString()
  @IsOptional()
  disabilityType?: string;

  @IsString()
  @IsOptional()
  disabilityPercentage?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UniversityStudentDto)
  @IsOptional()
  universityStudents?: UniversityStudentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MinorDto)
  @IsOptional()
  minors?: MinorDto[];
}
