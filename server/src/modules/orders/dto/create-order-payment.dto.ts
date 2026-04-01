import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrderPaymentDto {
  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'SINPE' })
  @IsString()
  @MaxLength(40)
  paymentMethod!: string;

  @ApiPropertyOptional({ example: 'SINPE-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  reference?: string;

  @ApiPropertyOptional({ example: 'Abono parcial de la semana' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
