import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class SmsService {
    private configService;
    private prisma;
    private readonly logger;
    private eskizToken;
    private tokenExpiresAt;
    constructor(configService: ConfigService, prisma: PrismaService);
    private cleanPhone;
    private getEskizToken;
    sendSms(phone: string, message: string): Promise<{
        success: boolean;
        status: string;
    }>;
    sendAttendanceAlert(parentPhone: string, studentName: string, groupName: string): Promise<{
        success: boolean;
        status: string;
    }>;
    sendPaymentReceipt(parentPhone: string, studentName: string, amount: number, newBalance: number): Promise<{
        success: boolean;
        status: string;
    }>;
    sendDebtAlert(parentPhone: string, studentName: string, debtAmount: number, groupName: string): Promise<{
        success: boolean;
        status: string;
    }>;
    getLogs(): Promise<{
        id: string;
        phone: string;
        status: string;
        message: string;
        sentAt: Date;
    }[]>;
}
