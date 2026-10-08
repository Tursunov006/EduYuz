import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { TelegramService } from '../telegram/telegram.service';
import { SmsService } from '../sms/sms.service';
export declare class PaymentsService {
    private prisma;
    private telegramService;
    private smsService;
    private readonly logger;
    constructor(prisma: PrismaService, telegramService: TelegramService, smsService: SmsService);
    create(dto: CreatePaymentDto): Promise<{
        student: {
            id: string;
            fullName: string;
            phone: string | null;
            parentPhone: string;
            parentChatId: bigint | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            coins: number;
            points: number;
            status: import(".prisma/client").$Enums.StudentStatus;
            createdAt: Date;
            centerId: string;
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
            fullName: string;
            phone: string | null;
            parentPhone: string;
            parentChatId: bigint | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            coins: number;
            points: number;
            status: import(".prisma/client").$Enums.StudentStatus;
            createdAt: Date;
            centerId: string;
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    }>;
    resetAllPayments(): Promise<{
        success: boolean;
        message: string;
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
    createAtmosInvoice(studentId: string, amount: number): Promise<{
        url: string;
    }>;
    atmosCallback(data: any, signature: string): Promise<{
        status: number;
        message: string;
    }>;
}
