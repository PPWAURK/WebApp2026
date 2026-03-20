import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeLevel, NewsAudience } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  type UploadModule,
  type UploadSection,
  UPLOAD_SECTION_BY_MODULE,
} from '../../uploads/upload-taxonomy';

const UPLOAD_MODULES = Object.keys(UPLOAD_SECTION_BY_MODULE) as UploadModule[];
const UPLOAD_SECTIONS = Object.values(UPLOAD_SECTION_BY_MODULE).flat();

export class CreateNewsPostDto {
  @ApiProperty({ example: 'Nouvelle procédure cuisine' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Merci de lire le document mis à jour.' })
  @IsString()
  @MaxLength(5000)
  message!: string;

  @ApiPropertyOptional({ enum: NewsAudience, example: NewsAudience.ALL })
  @IsOptional()
  @IsEnum(NewsAudience)
  audience?: NewsAudience;

  @ApiPropertyOptional({ type: [String], example: ['hygiene', 'kitchen'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    enum: EmployeeLevel,
    isArray: true,
    example: [EmployeeLevel.L1_PARTNER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EmployeeLevel, { each: true })
  visibleEmployeeLevels?: EmployeeLevel[];

  @ApiPropertyOptional({ enum: UPLOAD_MODULES })
  @IsOptional()
  @IsIn(UPLOAD_MODULES)
  module?: UploadModule;

  @ApiPropertyOptional({ enum: UPLOAD_SECTIONS })
  @IsOptional()
  @IsIn(UPLOAD_SECTIONS)
  section?: UploadSection;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attachmentDocumentId?: number;
}
