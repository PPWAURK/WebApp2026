import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'EMAIL_VERIFICATION_TOKEN_REQUIRED' })
  token: string;
}
