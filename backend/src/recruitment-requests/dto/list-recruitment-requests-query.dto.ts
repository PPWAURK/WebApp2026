import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecruitmentRequestStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListRecruitmentRequestsQueryDto {
  @ApiPropertyOptional({ enum: RecruitmentRequestStatus })
  @IsOptional()
  @IsEnum(RecruitmentRequestStatus)
  status?: RecruitmentRequestStatus;
}
