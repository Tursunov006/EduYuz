import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'O\'quvchi ID (studentId) kiritilishi shart' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'To\'lov miqdori kiritilishi shart' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNotEmpty({ message: 'To\'lov usuli (paymentMethod) kiritilishi shart' })
  @IsEnum(PaymentType)
  paymentMethod: PaymentType;

  @IsOptional()
  @IsString()
  comment?: string;
}
