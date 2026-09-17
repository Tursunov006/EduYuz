import { IsNotEmpty, IsString } from 'class-validator';

export class SendSmsDto {
  @IsNotEmpty({ message: "Telefon raqam kiritilishi shart" })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: "Xabar matni kiritilishi shart" })
  @IsString()
  message: string;
}
