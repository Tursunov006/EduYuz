import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(dto: CreatePaymentDto): Promise<{
        student: {
            id: string;
            phone: string | null;
            createdAt: Date;
            centerId: string;
            fullName: string;
            parentPhone: string;
            parentChatId: bigint | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            coins: number;
            points: number;
            status: import(".prisma/client").$Enums.StudentStatus;
        };
    } & {
        id: string;
        studentId: string;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
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
            phone: string;
            fullName: string;
        };
    } & {
        id: string;
        studentId: string;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
    })[]>;
    findOne(id: string): Promise<{
        student: {
            id: string;
            phone: string | null;
            createdAt: Date;
            centerId: string;
            fullName: string;
            parentPhone: string;
            parentChatId: bigint | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            coins: number;
            points: number;
            status: import(".prisma/client").$Enums.StudentStatus;
        };
    } & {
        id: string;
        studentId: string;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
    }>;
    clickPrepare(data: any): Promise<{
        click_trans_id: any;
        merchant_trans_id: any;
        error: number;
        error_note: string;
        merchant_prepare_id?: undefined;
    } | {
        click_trans_id: any;
        merchant_trans_id: any;
        merchant_prepare_id: number;
        error: number;
        error_note: string;
    }>;
    clickComplete(data: any): Promise<{
        click_trans_id: any;
        merchant_trans_id: any;
        error: number;
        error_note: string;
        merchant_confirm_id?: undefined;
    } | {
        click_trans_id: any;
        merchant_trans_id: any;
        merchant_confirm_id: number;
        error: number;
        error_note: string;
    }>;
}
