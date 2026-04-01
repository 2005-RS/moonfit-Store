import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PAYMENT_TYPES } from '../../../common/domain/domain.constants';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'cm_product_id' })
  @IsString()
  @MaxLength(40)
  productId!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'cm_customer_id' })
  @IsOptional()
  @ApiProperty({ example: 'Ana Perez' })
  @IsString()
  @MaxLength(40)
  customerId?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName!: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  customerEmail!: string;

  @ApiPropertyOptional({ example: '+50677776666' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'Cartago' })
  @IsOptional()
  @ApiProperty({ example: 'CARD' })
  @IsString()
  @MaxLength(80)
  customerCity?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  paymentMethod!: string;

  @ApiPropertyOptional({ enum: PAYMENT_TYPES, example: 'CREDIT' })
  @IsOptional()
  @IsString()
  @IsIn(PAYMENT_TYPES)
  paymentType?: (typeof PAYMENT_TYPES)[number];

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shipping?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({ example: 'Entrega en la tarde' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
