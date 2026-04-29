import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSupplierOrderSettingsDto {
  @ApiProperty({
    example: true,
    description:
      'When enabled, newly created orders include every supplier product with zero quantity for unselected rows.',
  })
  @IsBoolean()
  includeAllProductsInOrder!: boolean;

  @ApiProperty({
    required: false,
    maxLength: 500,
    example: '下单前请确认规格、单位和送货日期。',
    description:
      'Supplier-specific ordering notice displayed on the product order page.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  orderNotice?: string;
}
