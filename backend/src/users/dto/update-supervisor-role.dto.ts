import { Role } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSupervisorRoleDto {
  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsInt()
  @Min(1)
  primaryRestaurantId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  managedRestaurantIds?: number[];
}
