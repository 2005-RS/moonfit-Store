import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ORDER_STATUSES,
  type OrderStatus,
} from '../../../common/domain/domain.constants';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES, example: 'PROCESSING' })
  @IsIn(ORDER_STATUSES)
  status!: OrderStatus;
}
