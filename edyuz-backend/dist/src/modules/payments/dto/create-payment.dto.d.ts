import { PaymentType } from '@prisma/client';
export declare class CreatePaymentDto {
    studentId: string;
    amount: number;
    paymentMethod: PaymentType;
    comment?: string;
}
