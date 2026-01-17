import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddNotesDto {
  @ApiProperty()
  @IsString()
  notes: string;
}
