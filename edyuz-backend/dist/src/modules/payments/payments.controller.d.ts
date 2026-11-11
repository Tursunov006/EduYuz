import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly access;
    constructor(paymentsService: PaymentsService, access: AccessService);
    create(dto: CreatePaymentDto, user: AuthUser): Promise<{
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
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    }>;
    chargeMonthly(user: AuthUser, groupId?: string): Promise<{
        success: boolean;
        count: number;
        skipped: number;
        totalCharged: number;
        message: string;
    }>;
    findAll(user?: AuthUser, studentId?: string): Promise<({
        student: {
            id: string;
            phone: string;
            fullName: string;
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    })[]>;
    findOne(id: string, user: AuthUser): Promise<{
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
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    }>;
    clickPrepare(data: any): Promise<{
        click_trans_id: any;
        merchant_trans_id: any;
        error: number;
        error_note: string;
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
    } | {
        click_trans_id: any;
        merchant_trans_id: any;
        merchant_confirm_id: number;
        error: number;
        error_note: string;
    }>;
    createAtmosInvoice(body: {
        studentId: string;
        amount: number;
    }): Promise<{
        url: any;
    }>;
    atmosCallback(data: any, sign: string): Promise<{
        status: number;
        message: string;
    }>;
}
