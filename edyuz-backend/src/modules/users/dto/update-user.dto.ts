import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleType } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' })
  password?: string;

  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
