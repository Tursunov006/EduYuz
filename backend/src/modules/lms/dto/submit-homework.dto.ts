import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitHomeworkDto {
  @IsNotEmpty({ message: 'Vazifa ID kiritilishi shart' })
  @IsString()
  homeworkId: string;

  @IsNotEmpty({ message: 'O\'quvchi ID kiritilishi shart' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'Topshiriq javobi yoki havolasi kiritilishi shart' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
