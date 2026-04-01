import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetCustomerPasswordDto {
  @ApiProperty({ example: 'NuevaClave123' })
  @IsString()
  @MinLength(6)
  password!: string;
}
