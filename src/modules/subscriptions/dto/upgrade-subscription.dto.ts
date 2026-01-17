import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeSubscriptionDto {
  @ApiProperty()
  @IsString()
  newPlanId: string;
}
