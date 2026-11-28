import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  challengeId: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kod 6 ta raqamdan iborat bo\'lishi kerak' })
  code: string;
}

export class DisableTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
