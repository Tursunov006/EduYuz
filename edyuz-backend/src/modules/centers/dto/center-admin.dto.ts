import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateCenterStatusDto {
  @IsIn(['active', 'trial', 'expired'], {
    message: "Holat 'active', 'trial' yoki 'expired' bo'lishi kerak",
  })
  status: 'active' | 'trial' | 'expired';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;
}

export class ResetDirectorPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Parol kamida 8 belgidan iborat bo'lishi kerak" })
  @MaxLength(72)
  password?: string;
}
