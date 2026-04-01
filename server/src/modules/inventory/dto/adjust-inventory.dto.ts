import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength, Min, NotEquals } from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({ example: 'cm_product_id' })
  @IsString()
  @MaxLength(40)
  productId!: string;

  @ApiProperty({
    example: -2,
    description: 'Use positive values for stock in, negative for stock out.',
  })
  @IsNumber()
  @Min(-999999)
  @NotEquals(0)
  quantity!: number;

  @ApiProperty({ example: 'Damaged units removed from stock' })
  @IsString()
  @MaxLength(200)
  reason!: string;
}
