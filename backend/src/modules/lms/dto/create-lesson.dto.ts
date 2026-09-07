import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateLessonDto {
  @IsNotEmpty({ message: 'Guruh ID kiritilishi shart' })
  @IsString()
  groupId: string;

  @IsNotEmpty({ message: 'Dars mavzusi kiritilishi shart' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}
