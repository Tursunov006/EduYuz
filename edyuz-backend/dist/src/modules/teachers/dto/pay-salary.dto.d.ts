import { PaymentType } from '@prisma/client';
export declare class PaySalaryDto {
    amount: number;
    periodMonth: string;
    paymentMethod?: PaymentType;
    comment?: string;
}
