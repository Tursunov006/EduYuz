import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Telefon raqam kiritilishi shart' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'Parol kiritilishi shart' })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' })
  password: string;

  // Cloudflare Turnstile tokeni (TURNSTILE_SECRET_KEY o'rnatilgan bo'lsa majburiy)
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  turnstileToken?: string;
}
