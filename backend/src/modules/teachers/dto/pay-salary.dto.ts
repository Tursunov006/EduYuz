import { IsNotEmpty, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';
import { PaymentType } from '@prisma/client';

export class PaySalaryDto {
  @IsNotEmpty({ message: "To'lov summasi kiritilishi shart" })
  @IsNumber()
  amount: number;

  @IsNotEmpty({ message: "Oylik davri kiritilishi shart (masalan, 2026-09)" })
  @IsString()
  periodMonth: string;

  @IsOptional()
  @IsIn(['cash', 'card', 'click', 'payme'])
  paymentMethod?: PaymentType;

  @IsOptional()
  @IsString()
  comment?: string;
}
