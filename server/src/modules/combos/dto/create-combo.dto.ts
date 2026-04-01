import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { RECORD_STATUSES } from '../../../common/domain/domain.constants';

export class CreateComboItemDto {
  @ApiProperty({ example: 'cm_product_id' })
  @IsString()
  @MaxLength(40)
  productId!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateComboDto {
  @ApiProperty({ example: 'Stack fuerza basica' })
  @IsString()
  @MaxLength(140)
  title!: string;

  @ApiProperty({
    example:
      'Combo pensado para clientes que quieren una compra guiada de fuerza y recuperacion.',
  })
  @IsString()
  @MaxLength(320)
  subtitle!: string;

  @ApiProperty({
    example:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
  })
  @IsString()
  @MaxLength(500)
  image!: string;

  @ApiProperty({ example: 69 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 79 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  previousPrice?: number | null;

  @ApiProperty({ example: 'Agregar combo' })
  @IsString()
  @MaxLength(60)
  ctaLabel!: string;

  @ApiPropertyOptional({ enum: RECORD_STATUSES, example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @IsIn(RECORD_STATUSES)
  status?: (typeof RECORD_STATUSES)[number];

  @ApiProperty({ type: [CreateComboItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateComboItemDto)
  items!: CreateComboItemDto[];
}
