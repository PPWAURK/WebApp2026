import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class ResendVerificationEmailDto {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;

  @IsOptional()
  @IsIn(['fr', 'zh'], { message: 'INVALID_LANGUAGE' })
  language?: 'fr' | 'zh';
}
