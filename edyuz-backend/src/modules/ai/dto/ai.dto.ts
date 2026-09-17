import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class GenerateLessonDto {
  @IsNotEmpty()
  @IsString()
  topic: string;

  @IsOptional()
  @IsString()
  courseTitle?: string;

  @IsOptional()
  @IsString()
  level?: string;
}

export class GenerateQuizDto {
  @IsNotEmpty()
  @IsString()
  topic: string;

  @IsOptional()
  @IsNumber()
  count?: number;
}

export class AiChatDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsString()
  topic?: string;
}
