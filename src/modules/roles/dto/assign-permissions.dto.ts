import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class AssignRoleDto {
  @ApiProperty()
  @IsString()
  roleId: string;
}
