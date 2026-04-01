import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const CUSTOMER_SORT_FIELDS = ['createdAt', 'name', 'email', 'status'] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export class AdminCustomerListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SORT_FIELDS)
  sortBy?: (typeof CUSTOMER_SORT_FIELDS)[number] = 'createdAt';

  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortDirection?: (typeof SORT_DIRECTIONS)[number] = 'desc';
}
