import { IsPositive, IsNotEmpty, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';
import { ExpenseCategory, PaymentType } from '@prisma/client';

export class CreateExpenseDto {
  @IsNotEmpty({ message: "Xarajat nomi kiritilishi shart" })
  @IsString()
  title: string;

  @IsNotEmpty({ message: "Miqdor kiritilishi shart" })
  @IsNumber()
  @IsPositive({ message: "Miqdor musbat son bo'lishi kerak" })
  amount: number;

  @IsOptional()
  @IsIn(['rent', 'salary', 'utilities', 'marketing', 'equipment', 'stationery', 'tax', 'other'])
  category?: ExpenseCategory;

  @IsOptional()
  @IsIn(['cash', 'card', 'click', 'payme'])
  paymentMethod?: PaymentType;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  centerId?: string;
}
