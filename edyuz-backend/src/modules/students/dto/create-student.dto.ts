import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @IsNotEmpty({ message: 'Markaz ID (centerId) kiritilishi shart' })
  @IsString()
  centerId: string;

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
}
