import { IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateCenterDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Markaz profil rasmi: brauzerda kichraytirilgan PNG/JPEG/WEBP (data URL, ~500 KB gacha). null — rasmni o'chirish.
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, { message: "Rasm PNG, JPG yoki WEBP bo'lishi kerak" })
  @MaxLength(700_000, { message: 'Rasm hajmi juda katta' })
  logoUrl?: string | null;
}
