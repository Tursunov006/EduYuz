import { MinLength, Min, IsOptional, IsString, IsNumber, IsIn, IsBoolean } from 'class-validator';

export class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak" })
  password?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsIn(['percentage', 'fixed'])
  salaryType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
