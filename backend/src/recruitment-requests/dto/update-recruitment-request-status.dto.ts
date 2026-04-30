import { ApiProperty } from '@nestjs/swagger';
import { RecruitmentRequestStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateRecruitmentRequestStatusDto {
  @ApiProperty({
    enum: RecruitmentRequestStatus,
    example: RecruitmentRequestStatus.PROCESSED,
  })
  @IsEnum(RecruitmentRequestStatus)
  status!: RecruitmentRequestStatus;
}
