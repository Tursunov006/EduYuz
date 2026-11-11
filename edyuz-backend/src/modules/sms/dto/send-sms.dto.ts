import { Matches, MaxLength, IsNotEmpty, IsString } from 'class-validator';

export class SendSmsDto {
  @IsNotEmpty({ message: "Telefon raqam kiritilishi shart" })
  @IsString()
  @Matches(/^\+?[\d\s()-]{9,20}$/, { message: "Telefon raqam formati noto'g'ri" })
  phone: string;

  @IsNotEmpty({ message: "Xabar matni kiritilishi shart" })
  @IsString()
  @MaxLength(800, { message: "Xabar 800 belgidan oshmasligi kerak" })
  message: string;
}
