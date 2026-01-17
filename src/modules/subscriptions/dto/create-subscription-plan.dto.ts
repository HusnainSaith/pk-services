import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  Min,
  MaxLength,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new subscription plan
 */
export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Plan name (e.g., Basic, Professional, Premium)',
    example: 'Professional',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Perfect for small businesses and professionals',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Monthly price in EUR',
    example: 29.99,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priceMonthly?: number;

  @ApiProperty({
    description: 'Annual price in EUR (typically discounted)',
    example: 299.99,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priceAnnual?: number;

  @ApiProperty({
    description: 'Plan features list',
    example: [
      'Unlimited service requests',
      'Priority support',
      'Advanced analytics',
      'Custom reports',
    ],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({
    description: 'Service usage limits',
    example: {
      serviceRequests: 10,
      documentUploads: 50,
      appointments: 5,
      familyMembers: 8,
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  serviceLimits?: {
    serviceRequests?: number;
    documentUploads?: number;
    appointments?: number;
    familyMembers?: number;
    [key: string]: any;
  };

  @ApiProperty({
    description:
      'Whether the plan is active and available for new subscriptions',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Stripe Price ID for monthly billing',
    example: 'price_1234567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripePriceIdMonthly?: string;

  @ApiProperty({
    description: 'Stripe Price ID for annual billing',
    example: 'price_0987654321fedcba',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripePriceIdAnnual?: string;
}
