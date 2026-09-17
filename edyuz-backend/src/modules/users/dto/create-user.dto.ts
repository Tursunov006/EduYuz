import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleType } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Markaz ID (centerId) kiritilishi shart' })
  @IsString()
  centerId: string;

  @IsNotEmpty({ message: 'To\'liq ism-familiya kiritilishi shart' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Telefon raqam kiritilishi shart' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'Parol kiritilishi shart' })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' })
  password: string;

  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
