import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RECORD_STATUSES,
  type RecordStatus,
} from '../../../common/domain/domain.constants';

export class CreateCustomerDto {
  @ApiPropertyOptional({ example: 'cm123customer' })
  @IsOptional()
  @ApiProperty({ example: 'Ana Perez' })
  @IsString()
  @MaxLength(40)
  userId?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+50677776666' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'Heredia' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ enum: RECORD_STATUSES, example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @IsIn(RECORD_STATUSES)
  status?: RecordStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  creditApproved?: boolean;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditDays?: number;
}
