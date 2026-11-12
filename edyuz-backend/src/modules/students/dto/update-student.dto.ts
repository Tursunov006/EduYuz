import { IsIn, IsDateString, IsEnum, MaxLength, IsNumber, IsOptional, IsString } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

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
}
