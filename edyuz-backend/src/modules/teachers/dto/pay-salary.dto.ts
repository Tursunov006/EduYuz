import { IsPositive, Matches, IsNotEmpty, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class PaySalaryDto {
  @IsNotEmpty({ message: "To'lov summasi kiritilishi shart" })
  @IsNumber()
  @IsPositive({ message: "To'lov summasi musbat son bo'lishi kerak" })
  amount: number;

  @IsNotEmpty({ message: "Oylik davri kiritilishi shart (masalan, 2026-09)" })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "Oylik davri YYYY-MM formatida bo'lishi kerak" })
  periodMonth: string;

  @IsOptional()
  @IsIn(['cash', 'card', 'click', 'payme'])
  paymentMethod?: PaymentType;

  @IsOptional()
  @IsString()
  comment?: string;
}
