import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const ORDER_SORT_FIELDS = [
  'createdAt',
  'customerName',
  'total',
  'status',
] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export class AdminOrderListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(ORDER_SORT_FIELDS)
  sortBy?: (typeof ORDER_SORT_FIELDS)[number] = 'createdAt';

  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortDirection?: (typeof SORT_DIRECTIONS)[number] = 'desc';
}
