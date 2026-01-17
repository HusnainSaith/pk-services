import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCmsContentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  type: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({ required: false, default: 'draft' })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;
}
