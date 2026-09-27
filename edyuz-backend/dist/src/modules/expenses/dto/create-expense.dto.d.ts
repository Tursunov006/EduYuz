import { ExpenseCategory, PaymentType } from '@prisma/client';
export declare class CreateExpenseDto {
    title: string;
    amount: number;
    category?: ExpenseCategory;
    paymentMethod?: PaymentType;
    comment?: string;
    centerId?: string;
}
