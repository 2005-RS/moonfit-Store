import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { RECORD_STATUSES } from '../../../common/domain/domain.constants';

export const CAMPAIGN_PLACEMENTS = [
  'HOME_HERO',
  'HOME_SECONDARY',
  'CATALOG_HIGHLIGHT',
] as const;

export class CreateCampaignDto {
  @ApiProperty({ example: 'Stack fuerza: whey + creatina' })
  @IsString()
  @MaxLength(140)
  title!: string;

  @ApiProperty({
    example:
      'Promocion principal para clientes que buscan recuperacion y rendimiento.',
  })
  @IsString()
  @MaxLength(320)
  subtitle!: string;

  @ApiProperty({ example: 'Ver stacks' })
  @IsString()
  @MaxLength(60)
  ctaLabel!: string;

  @ApiProperty({ example: '/catalogo' })
  @IsString()
  @MaxLength(200)
  ctaHref!: string;

  @ApiProperty({
    example:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
  })
  @IsString()
  @MaxLength(500)
  image!: string;

  @ApiProperty({ enum: CAMPAIGN_PLACEMENTS, example: 'HOME_HERO' })
  @IsString()
  @IsIn(CAMPAIGN_PLACEMENTS)
  placement!: (typeof CAMPAIGN_PLACEMENTS)[number];

  @ApiPropertyOptional({ example: 'Hasta 15% menos' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  discountTag?: string;

  @ApiPropertyOptional({ enum: RECORD_STATUSES, example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @IsIn(RECORD_STATUSES)
  status?: (typeof RECORD_STATUSES)[number];
}
