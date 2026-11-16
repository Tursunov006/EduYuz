import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class IssueCertificateDto {
  @IsNotEmpty({ message: 'O\'quvchi ID kiritilishi shart' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'Kurs nomi kiritilishi shart' })
  @IsString()
  courseTitle: string;

  @IsOptional()
  @IsString()
  grade?: string;
}

export class UpdateCertificateDto {
  @IsOptional()
  @IsNotEmpty({ message: "Kurs nomi bo'sh bo'lmasin" })
  @IsString()
  @MaxLength(150)
  courseTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  grade?: string;
}
