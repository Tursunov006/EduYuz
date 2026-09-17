import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class SubmitGameDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsNotEmpty()
  @IsString()
  gameType: string;

  @IsNotEmpty()
  @IsString()
  topic: string;

  @IsNotEmpty()
  @IsNumber()
  score: number;

  @IsNotEmpty()
  @IsNumber()
  correctCount: number;

  @IsNotEmpty()
  @IsNumber()
  totalQuestions: number;

  @IsOptional()
  @IsNumber()
  comboStreak?: number;
}
