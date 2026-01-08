import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NoteDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  type?: 'internal' | 'user'; // internal for admin/operator, user for customer-visible
}

export class AddNoteDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  type?: 'internal' | 'user';
}

export class UpdateNoteDto {
  @IsString()
  content: string;
}

export class ListServiceRequestsDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  serviceTypeId?: string;

  @IsString()
  @IsOptional()
  assignedOperatorId?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsOptional()
  skip?: number;

  @IsOptional()
  take?: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}

export class SubmitServiceRequestDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DocumentChecklistDto {
  @IsString()
  documentType: string;

  @IsString()
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';

  @IsOptional()
  mandatory?: boolean;
}
