import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Telefon raqam kiritilishi shart' })
  @IsString()
  @MaxLength(32)
  phone: string;

  // Cloudflare Turnstile tokeni (TURNSTILE_SECRET_KEY o'rnatilgan bo'lsa majburiy)
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  turnstileToken?: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  challengeId: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kod 6 ta raqamdan iborat bo\'lishi kerak' })
  code: string;

  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' })
  @MaxLength(128)
  newPassword: string;
}
