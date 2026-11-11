import { IsInt, Max, MaxLength, Min, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AwardCoinsDto {
  @IsNotEmpty({ message: 'O\'quvchi ID kiritilishi shart' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'Coin miqdori kiritilishi shart' })
  @IsInt({ message: 'Coin miqdori butun son bo\'lishi kerak' })
  @Min(-10000)
  @Max(10000)
  amount: number;

  @IsNotEmpty({ message: 'Sabab kiritilishi shart' })
  @IsString()
  @MaxLength(150)
  reason: string;
}
