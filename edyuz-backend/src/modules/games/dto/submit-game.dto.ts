import { IsInt, Max, MaxLength, Min, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class SubmitGameDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsNotEmpty()
  @IsString()
  gameType: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  topic: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  score: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(100)
  correctCount: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(100)
  totalQuestions: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  comboStreak?: number;
}
