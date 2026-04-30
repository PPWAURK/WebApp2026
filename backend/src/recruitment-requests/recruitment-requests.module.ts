import { Module } from '@nestjs/common';
import { RecruitmentRequestsController } from './recruitment-requests.controller';
import { RecruitmentRequestsService } from './recruitment-requests.service';

@Module({
  controllers: [RecruitmentRequestsController],
  providers: [RecruitmentRequestsService],
})
export class RecruitmentRequestsModule {}
