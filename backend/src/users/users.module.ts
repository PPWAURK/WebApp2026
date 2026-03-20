import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { UsersApprovalService } from './users-approval.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersTrainingAccessService } from './users-training-access.service';
import { UsersWorkforceService } from './users-workforce.service';

@Module({
  imports: [MailModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersTrainingAccessService,
    UsersWorkforceService,
    UsersApprovalService,
  ],
  exports: [UsersService, UsersTrainingAccessService],
})
export class UsersModule {}
