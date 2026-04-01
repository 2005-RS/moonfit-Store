import {
  Transform,
} from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RECORD_STATUSES,
  type RecordStatus,
} from '../../../common/domain/domain.constants';

export class CreateProductDto {
  @ApiProperty({ example: 'Audifonos Wave Pro' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'audifonos-wave-pro' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiPropertyOptional({
    example: 'Audifonos inalambricos con cancelacion de ruido.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 89 })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return value;
    }

    return Number(value);
  })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 109 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsNumber()
  @Min(0)
  previousPrice?: number | null;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: '2026-04-15' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return String(value);
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expirationDate?: string;

  @ApiPropertyOptional({ example: 'Mas vendido' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  badge?: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/product.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({ enum: RECORD_STATUSES, example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @IsIn(RECORD_STATUSES)
  status?: RecordStatus;

  @ApiPropertyOptional({ example: 'cm_brand_id' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  brandId?: string | null;

  @ApiPropertyOptional({ example: 'cm_category_id' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  categoryId?: string | null;

  @ApiPropertyOptional({
    example: ['Ganar masa muscular', 'Recuperacion'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  goals?: string[];
}
