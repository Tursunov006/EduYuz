import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(dto: CreatePaymentDto): Promise<{
        student: {
            id: string;
            centerId: string;
            fullName: string;
            phone: string | null;
            parentPhone: string;
            parentChatId: bigint | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            coins: number;
            points: number;
            status: import(".prisma/client").$Enums.StudentStatus;
            createdAt: Date;
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    }>;
    chargeMonthly(groupId?: string): Promise<{
        success: boolean;
        count: number;
        totalCharged: number;
        message: string;
    }>;
    findAll(studentId?: string): Promise<({
        student: {
            id: string;
            fullName: string;
            phone: string;
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    })[]>;
    findOne(id: string): Promise<{
        student: {
            id: string;
            centerId: string;
            fullName: string;
            phone: string | null;
            parentPhone: string;
            parentChatId: bigint | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            coins: number;
            points: number;
            status: import(".prisma/client").$Enums.StudentStatus;
            createdAt: Date;
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    }>;
}
