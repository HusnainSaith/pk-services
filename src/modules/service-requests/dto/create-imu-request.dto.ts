import {
  IsString,
  IsOptional,
  IsArray,
  IsDate,
  IsNumber,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class CadastralDataDto {
  @IsString()
  @IsOptional()
  cadastralMunicipality?: string;

  @IsString()
  @IsOptional()
  section?: string;

  @IsString()
  @IsOptional()
  sheet?: string;

  @IsString()
  @IsOptional()
  parcel?: string;

  @IsString()
  @IsOptional()
  subparcel?: string;

  @IsString()
  @IsOptional()
  cadastralCategory?: string;

  @IsString()
  @IsOptional()
  cadastralClass?: string;

  @IsNumber()
  @IsOptional()
  rentValue?: number;
}

class PropertyDataDto {
  @IsString()
  @IsOptional()
  id?: string;

  @ValidateNested()
  @Type(() => CadastralDataDto)
  @IsOptional()
  cadastralData?: CadastralDataDto;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  purchaseDate?: Date;

  @IsNumber()
  @IsOptional()
  purchasePrice?: number;
}

class PropertyUsageDto {
  @IsString()
  propertyId: string;

  @IsString()
  usage: string;

  @IsNumber()
  @IsOptional()
  percentage?: number;
}

class ExemptionDto {
  @IsString()
  propertyId: string;

  @IsString()
  type: string;

  @IsString()
  description: string;

  @IsNumber()
  year: number;
}

class VariationDto {
  @IsString()
  propertyId: string;

  @IsString()
  variationType: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  details: string;
}

class ImuPaymentDto {
  @IsString()
  propertyId: string;

  @IsNumber()
  year: number;

  @IsNumber()
  amount: number;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  paymentDate?: Date;

  @IsString()
  @IsOptional()
  status?: 'paid' | 'unpaid' | 'partial';
}

class InheritanceDataDto {
  @IsString()
  @IsOptional()
  inheritor?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  inheritanceDate?: Date;

  @IsArray()
  @IsOptional()
  inheritedProperties?: Array<{
    propertyId: string;
    inheritancePercentage: number;
  }>;
}

export class CreateImuRequestDto {
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

  @IsString()
  @IsOptional()
  taxpayerType?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  municipality?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyDataDto)
  @IsOptional()
  properties?: PropertyDataDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyUsageDto)
  @IsOptional()
  propertyUsage?: PropertyUsageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExemptionDto)
  @IsOptional()
  exemptions?: ExemptionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariationDto)
  @IsOptional()
  variations?: VariationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImuPaymentDto)
  @IsOptional()
  imuPayments?: ImuPaymentDto[];

  @IsBoolean()
  @IsOptional()
  hasInheritance?: boolean;

  @ValidateNested()
  @Type(() => InheritanceDataDto)
  @IsOptional()
  inheritanceData?: InheritanceDataDto;

  @IsNumber()
  @IsOptional()
  taxYear?: number;
}

export class UpdateImuRequestDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  fiscalCode?: string;

  @IsString()
  @IsOptional()
  taxpayerType?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  municipality?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyDataDto)
  @IsOptional()
  properties?: PropertyDataDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyUsageDto)
  @IsOptional()
  propertyUsage?: PropertyUsageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExemptionDto)
  @IsOptional()
  exemptions?: ExemptionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariationDto)
  @IsOptional()
  variations?: VariationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImuPaymentDto)
  @IsOptional()
  imuPayments?: ImuPaymentDto[];

  @IsBoolean()
  @IsOptional()
  hasInheritance?: boolean;

  @ValidateNested()
  @Type(() => InheritanceDataDto)
  @IsOptional()
  inheritanceData?: InheritanceDataDto;

  @IsNumber()
  @IsOptional()
  taxYear?: number;
}
