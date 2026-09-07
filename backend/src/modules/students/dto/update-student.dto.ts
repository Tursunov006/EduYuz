import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
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
}
