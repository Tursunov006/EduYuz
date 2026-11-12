import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// O'quvchi o'zi to'ldiradigan anketa: faqat shaxsiy ma'lumotlar (balans, holat va h.k. yo'q)
export class AnketaDto {
  @IsNotEmpty({ message: 'Familiya va ism kiritilishi shart' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsNotEmpty({ message: 'Ota-ona telefoni kiritilishi shart' })
  @IsString()
  @MaxLength(20)
  parentPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  passport?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Tug\'ilgan sana formati noto\'g\'ri' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
