import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;

  @IsString({ message: 'PASSWORD_REQUIRED' })
  password: string;
}
