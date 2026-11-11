import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuizQuestionDto {
  @IsNotEmpty()
  @IsString()
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(7)
  correctIndex: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  points?: number;
}

export class CreateQuizDto {
  @IsNotEmpty({ message: 'Dars ID kiritilishi shart' })
  @IsString()
  lessonId: string;

  @IsNotEmpty({ message: 'Test nomi kiritilishi shart' })
  @IsString()
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}

export class SubmitQuizDto {
  @IsNotEmpty()
  @IsString()
  quizId: string;

  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsArray()
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  answers: number[];
}
