import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;

  @IsString({ message: 'PASSWORD_REQUIRED' })
  @MinLength(8, { message: 'PASSWORD_TOO_SHORT' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsInt({ message: 'RESTAURANT_REQUIRED' })
  @Min(1, { message: 'RESTAURANT_REQUIRED' })
  restaurantId: number;
}
