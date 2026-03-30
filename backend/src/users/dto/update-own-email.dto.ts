import { IsEmail, IsString, MinLength } from 'class-validator';

export class UpdateOwnEmailDto {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;

  @IsString({ message: 'CURRENT_PASSWORD_REQUIRED' })
  @MinLength(1, { message: 'CURRENT_PASSWORD_REQUIRED' })
  currentPassword: string;
}
