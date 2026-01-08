import {
  IsString,
  IsOptional,
  IsArray,
  IsDate,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CuDataDto {
  @IsString()
  @IsOptional()
  employer?: string;

  @IsNumber()
  @IsOptional()
  totalIncome?: number;

  @IsNumber()
  @IsOptional()
  taxableIncome?: number;

  @IsNumber()
  @IsOptional()
  taxWithheld?: number;
}

class IncomeItemDto {
  @IsString()
  type: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

class PropertyDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cadastralCategory?: string;

  @IsNumber()
  @IsOptional()
  rentIncome?: number;

  @IsNumber()
  @IsOptional()
  mortgageInterest?: number;
}

class MedicalDetailDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;
}

class EducationDetailDto {
  @IsString()
  student: string;

  @IsString()
  institution: string;

  @IsNumber()
  amount: number;
}

class MortgageDto {
  @IsString()
  lender: string;

  @IsOptional()
  principalResidence?: boolean;

  @IsNumber()
  @IsOptional()
  interest?: number;
}

class HomeBonusDto {
  @IsString()
  type: string;

  @IsNumber()
  amount: number;
}

class DependentDto {
  @IsString()
  name: string;

  @IsString()
  fiscalCode: string;

  @IsString()
  relationship: string;

  @IsDate()
  @Type(() => Date)
  birthDate: Date;
}

class LifeInsuranceDto {
  @IsString()
  company: string;

  @IsNumber()
  premiumAmount: number;
}

class PensionContributionDto {
  @IsString()
  type: string;

  @IsNumber()
  amount: number;
}

export class CreateModello730RequestDto {
  @IsString()
  serviceTypeId: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  fiscalCode?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthDate?: Date;

  @IsString()
  @IsOptional()
  birthPlace?: string;

  @ValidateNested()
  @Type(() => CuDataDto)
  @IsOptional()
  cuData?: CuDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomeItemDto)
  @IsOptional()
  inpsIncome?: IncomeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomeItemDto)
  @IsOptional()
  otherIncome?: IncomeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyDto)
  @IsOptional()
  properties?: PropertyDto[];

  @IsNumber()
  @IsOptional()
  medicalExpenses?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalDetailDto)
  @IsOptional()
  medicalDetails?: MedicalDetailDto[];

  @IsNumber()
  @IsOptional()
  educationExpenses?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDetailDto)
  @IsOptional()
  educationDetails?: EducationDetailDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MortgageDto)
  @IsOptional()
  mortgages?: MortgageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeBonusDto)
  @IsOptional()
  homeBonus?: HomeBonusDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependentDto)
  @IsOptional()
  dependents?: DependentDto[];

  @IsNumber()
  @IsOptional()
  familyMembersCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LifeInsuranceDto)
  @IsOptional()
  lifeInsurance?: LifeInsuranceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PensionContributionDto)
  @IsOptional()
  pensionContributions?: PensionContributionDto[];
}

export class UpdateModello730RequestDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  fiscalCode?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthDate?: Date;

  @IsString()
  @IsOptional()
  birthPlace?: string;

  @ValidateNested()
  @Type(() => CuDataDto)
  @IsOptional()
  cuData?: CuDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomeItemDto)
  @IsOptional()
  inpsIncome?: IncomeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomeItemDto)
  @IsOptional()
  otherIncome?: IncomeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyDto)
  @IsOptional()
  properties?: PropertyDto[];

  @IsNumber()
  @IsOptional()
  medicalExpenses?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalDetailDto)
  @IsOptional()
  medicalDetails?: MedicalDetailDto[];

  @IsNumber()
  @IsOptional()
  educationExpenses?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDetailDto)
  @IsOptional()
  educationDetails?: EducationDetailDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MortgageDto)
  @IsOptional()
  mortgages?: MortgageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeBonusDto)
  @IsOptional()
  homeBonus?: HomeBonusDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependentDto)
  @IsOptional()
  dependents?: DependentDto[];

  @IsNumber()
  @IsOptional()
  familyMembersCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LifeInsuranceDto)
  @IsOptional()
  lifeInsurance?: LifeInsuranceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PensionContributionDto)
  @IsOptional()
  pensionContributions?: PensionContributionDto[];
}
