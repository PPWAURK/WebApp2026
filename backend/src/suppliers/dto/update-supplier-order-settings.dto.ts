import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSupplierOrderSettingsDto {
  @ApiProperty({
    example: true,
    description:
      'When enabled, newly created orders include every supplier product with zero quantity for unselected rows.',
  })
  @IsBoolean()
  includeAllProductsInOrder!: boolean;
}
