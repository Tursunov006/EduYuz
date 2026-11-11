import { IsDateString, IsEnum, MaxLength, IsNumber, IsOptional, IsString } from 'class-validator';
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
}
