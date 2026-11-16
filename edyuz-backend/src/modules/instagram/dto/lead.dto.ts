import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateLeadDto {
  @IsNotEmpty({ message: 'Ism kiritilishi shart' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsNotEmpty({ message: 'Telefon raqam kiritilishi shart' })
  @IsString()
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: "Telefon raqam formati noto'g'ri" })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  course?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsIn(['new', 'contacted', 'trial', 'converted'])
  stage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  igUsername?: string;
}

// Lidni yangilash: bosqich va/yoki ma'lumotlar (ism, telefon, kurs, izoh)
export class UpdateLeadStageDto {
  @IsOptional()
  @IsIn(['new', 'contacted', 'trial', 'converted'], { message: "Bosqich noto'g'ri" })
  stage?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "Ism bo'sh bo'lmasin" })
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: "Telefon raqam formati noto'g'ri" })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  course?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class InstagramAiChatDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  senderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  igUsername?: string;
}
