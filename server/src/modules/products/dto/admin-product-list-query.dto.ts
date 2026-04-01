import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const PRODUCT_SORT_FIELDS = [
  'createdAt',
  'name',
  'price',
  'stock',
  'expirationDate',
] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export class AdminProductListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS)
  sortBy?: (typeof PRODUCT_SORT_FIELDS)[number] = 'createdAt';

  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortDirection?: (typeof SORT_DIRECTIONS)[number] = 'desc';
}
