import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;

  @IsString({ message: 'PASSWORD_REQUIRED' })
  password: string;

  @IsOptional()
  @IsIn(['fr', 'zh'], { message: 'INVALID_LANGUAGE' })
  language?: 'fr' | 'zh';
}
