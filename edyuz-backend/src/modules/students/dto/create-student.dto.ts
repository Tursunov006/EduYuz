import { IsIn, IsInt, Min, Max, IsDateString, IsEnum, MaxLength, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
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

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  // Otasining ismi
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  // O'quvchi yoki talaba
  @IsOptional()
  @IsIn(['oquvchi', 'talaba'], { message: 'Turi noto\'g\'ri (oquvchi yoki talaba)' })
  kind?: string;

  // Oylik to'lovdan chegirma (foiz, 0–100)
  @IsOptional()
  @IsInt({ message: 'Chegirma butun son bo\'lishi kerak' })
  @Min(0, { message: 'Chegirma 0% dan kam bo\'lmaydi' })
  @Max(100, { message: 'Chegirma 100% dan oshmaydi' })
  discount?: number;
}
