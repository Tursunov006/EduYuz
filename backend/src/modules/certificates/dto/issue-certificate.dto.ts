import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
