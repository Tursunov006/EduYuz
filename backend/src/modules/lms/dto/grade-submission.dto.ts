import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class GradeSubmissionDto {
  @IsNotEmpty({ message: 'Baho kiritilishi shart' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
