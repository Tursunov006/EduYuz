import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateHomeworkDto {
  @IsNotEmpty({ message: 'Dars ID kiritilishi shart' })
  @IsString()
  lessonId: string;

  @IsNotEmpty({ message: 'Vazifa sarlavhasi kiritilishi shart' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Vazifa topshirig\'i matni kiritilishi shart' })
  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  maxScore?: number;
}
