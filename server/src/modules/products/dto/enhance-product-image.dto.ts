import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EnhanceProductImageDto {
  @ApiPropertyOptional({
    example: '/uploads/product-images/product-abcd1234.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagePath?: string;

  @ApiPropertyOptional({ example: 'Whey Pro Series Vainilla' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  productName?: string;
}
