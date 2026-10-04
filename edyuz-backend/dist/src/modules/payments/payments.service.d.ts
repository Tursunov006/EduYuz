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
            createdAt: Date;
            centerId: string;
            fullName: string;
            phone: string | null;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date;
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
            fullName: string;
            phone: string;
        };
    } & {
        id: string;
        studentId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
    })[]>;
    findOne(id: string): Promise<{
        student: {
            id: string;
            createdAt: Date;
            centerId: string;
            fullName: string;
            phone: string | null;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
    }>;
}
