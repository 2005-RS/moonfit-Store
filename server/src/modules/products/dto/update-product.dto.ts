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
import {
  RECORD_STATUSES,
  type RecordStatus,
} from '../../../common/domain/domain.constants';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsNumber()
  @Min(0)
  price?: number;

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

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (value === '') {
      return null;
    }

    return String(value);
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expirationDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  badge?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(RECORD_STATUSES)
  status?: RecordStatus;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  brandId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  categoryId?: string | null;

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
