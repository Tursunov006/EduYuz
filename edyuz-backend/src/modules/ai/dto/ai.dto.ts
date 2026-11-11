import { IsInt, Max, MaxLength, Min, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class GenerateLessonDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
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
  @MaxLength(200)
  topic: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;
}

export class AiChatDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsString()
  topic?: string;
}

// Avval bu endpoint DTO'siz edi: validatsiya umuman ishlamasdi
export class GenerateMarketingDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  platform: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  topic: string;
}
