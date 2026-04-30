import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecruitmentContractType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRecruitmentRequestDto {
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  restaurantId?: number;

  @ApiProperty({ example: 'Serveur polyvalent' })
  @IsString()
  @MaxLength(191)
  position!: string;

  @ApiProperty({
    enum: RecruitmentContractType,
    example: RecruitmentContractType.FULL_TIME,
  })
  @IsEnum(RecruitmentContractType)
  contractType!: RecruitmentContractType;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  headcount!: number;

  @ApiPropertyOptional({
    example: 'Besoin avant le service du soir, expérience salle souhaitée.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
