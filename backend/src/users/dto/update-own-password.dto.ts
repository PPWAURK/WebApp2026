import { IsString, MinLength } from 'class-validator';

export class UpdateOwnPasswordDto {
  @IsString({ message: 'CURRENT_PASSWORD_REQUIRED' })
  @MinLength(1, { message: 'CURRENT_PASSWORD_REQUIRED' })
  currentPassword: string;

  @IsString({ message: 'PASSWORD_REQUIRED' })
  @MinLength(8, { message: 'PASSWORD_TOO_SHORT' })
  newPassword: string;
}
