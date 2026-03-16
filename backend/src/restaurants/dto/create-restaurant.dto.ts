import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

function trimStringValue({ value }: TransformFnParams): unknown {
  const input: unknown = value;
  return typeof input === 'string' ? input.trim() : input;
}

export class CreateRestaurantDto {
  @ApiProperty({ example: 'ZHAO Paris 11' })
  @Transform(trimStringValue)
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  name!: string;

  @ApiProperty({ example: '12 Rue Exemple, 75011 Paris' })
  @Transform(trimStringValue)
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  address!: string;
}
