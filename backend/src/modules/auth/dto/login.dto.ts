import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Telefon raqam kiritilishi shart' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'Parol kiritilishi shart' })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' })
  password: string;
}
