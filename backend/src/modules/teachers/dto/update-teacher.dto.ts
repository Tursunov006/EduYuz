import { IsOptional, IsString, IsNumber, IsIn, IsBoolean } from 'class-validator';

export class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsIn(['percentage', 'fixed'])
  salaryType?: string;

  @IsOptional()
  @IsNumber()
  salaryRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
