import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { TelegramService } from '../telegram/telegram.service';
import { SmsService } from '../sms/sms.service';
export declare class PaymentsService {
    private prisma;
    private telegramService;
    private smsService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, telegramService: TelegramService, smsService: SmsService, configService: ConfigService);
    private md5;
    private safeEqual;
    private findByExternalRef;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    }>;
    chargeMonthly(centerId: string, groupId?: string): Promise<{
        success: boolean;
        count: number;
        skipped: number;
        totalCharged: number;
        message: string;
    }>;
    findAll(studentId?: string, centerId?: string): Promise<({
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
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        studentId: string;
    }>;
    private verifyClickSign;
    private clickError;
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
    createAtmosInvoice(studentId: string, amount: number): Promise<{
        url: any;
    }>;
    atmosCallback(data: any, signature: string): Promise<{
        status: number;
        message: string;
    }>;
}
