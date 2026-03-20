import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Min } from 'class-validator';

const HISTORY_PERIODS = [
  '7d',
  '30d',
  'this_month',
  'last_month',
  'all',
] as const;

export class SupplierScopedQueryDto {
  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId?: number;
}

export class SupplierMonthQueryDto extends SupplierScopedQueryDto {
  @ApiPropertyOptional({ example: '2026-03' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'month must match YYYY-MM',
  })
  month?: string;
}

export class HistoryAnalyticsQueryDto extends SupplierScopedQueryDto {
  @ApiPropertyOptional({
    enum: HISTORY_PERIODS,
    example: 'this_month',
  })
  @IsOptional()
  @IsIn(HISTORY_PERIODS)
  period?: (typeof HISTORY_PERIODS)[number];
}
