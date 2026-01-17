import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty()
  @IsString()
  planId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class UpgradeSubscriptionDto {
  @ApiProperty()
  @IsString()
  newPlanId: string;
}

export class UpdateSubscriptionStatusDto {
  @ApiProperty({ enum: ['active', 'cancelled', 'past_due', 'unpaid'] })
  @IsString()
  status: string;
}

export class ProcessRefundDto {
  @ApiProperty()
  @IsString()
  amount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
