import { IsDateString, IsEnum, MaxLength, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  // Markaz serverda foydalanuvchi tokenidan aniqlanadi; bu maydon faqat superadmin uchun
  @IsOptional()
  @IsString()
  centerId?: string;

  @IsNotEmpty({ message: 'O\'quvchi to\'liq ismi (fullName) kiritilishi shart' })
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'Ota-ona telefoni (parentPhone) kiritilishi shart' })
  @IsString()
  parentPhone: string;

  @IsOptional()
  parentChatId?: bigint | number | string;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  passport?: string;

  // YYYY-MM-DD
  @IsOptional()
  @IsDateString({}, { message: 'Tug\'ilgan sana formati noto\'g\'ri' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
