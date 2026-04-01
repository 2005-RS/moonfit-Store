import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  USER_ROLES,
  type UserRole,
} from '../../../common/domain/domain.constants';

export class RegisterDto {
  @ApiProperty({ example: 'Ronny Mora' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ronny@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: USER_ROLES, example: 'CUSTOMER' })
  @IsOptional()
  @IsString()
  @IsIn(USER_ROLES)
  role?: UserRole;

  @ApiPropertyOptional({ example: '+50688887777' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'San Jose' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
}
