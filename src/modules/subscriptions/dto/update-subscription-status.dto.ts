import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubscriptionStatusDto {
  @ApiProperty({ enum: ['active', 'cancelled', 'past_due', 'unpaid'] })
  @IsString()
  status: string;
}
