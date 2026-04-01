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
import {
  RECORD_STATUSES,
  type RecordStatus,
} from '../../../common/domain/domain.constants';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(RECORD_STATUSES)
  status?: RecordStatus;

  @IsOptional()
  @IsBoolean()
  creditApproved?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditDays?: number;
}
