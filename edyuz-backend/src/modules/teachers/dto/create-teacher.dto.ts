import { IsNotEmpty, IsOptional, IsString, IsNumber, IsIn } from 'class-validator';

export class CreateTeacherDto {
  @IsNotEmpty({ message: "F.I.SH kiritilishi shart" })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: "Telefon raqam kiritilishi shart" })
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsIn(['percentage', 'fixed'], { message: "Maosh turi 'percentage' yoki 'fixed' bo'lishi kerak" })
  salaryType?: string;

  @IsOptional()
  @IsNumber({}, { message: "Maosh stavkasi son bo'lishi kerak" })
  salaryRate?: number;

  @IsOptional()
  @IsString()
  centerId?: string;
}
