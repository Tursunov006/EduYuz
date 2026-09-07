import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AwardCoinsDto {
  @IsNotEmpty({ message: 'O\'quvchi ID kiritilishi shart' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'Coin miqdori kiritilishi shart' })
  @IsNumber()
  amount: number;

  @IsNotEmpty({ message: 'Sabab kiritilishi shart' })
  @IsString()
  reason: string;
}
