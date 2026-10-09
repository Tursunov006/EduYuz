import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
export declare class TelegramService implements OnModuleInit {
    private configService;
    private prisma;
    private aiService;
    private readonly logger;
    private botToken;
    private isPolling;
    constructor(configService: ConfigService, prisma: PrismaService, aiService: AiService);
    onModuleInit(): void;
    sendMessage(chatId: string | number | bigint, text: string, replyMarkup?: any): Promise<boolean>;
    sendPhotoBase64(chatId: string | number | bigint, base64Data: string, caption?: string): Promise<boolean>;
    sendAttendanceAlert(parentChatId: bigint | string | null | undefined, studentName: string, groupName: string, status: string, date: string): Promise<void>;
    sendPaymentReceipt(parentChatId: bigint | string | null | undefined, studentName: string, amount: number, method: string, newBalance: number, comment?: string | null): Promise<void>;
    sendDebtAlert(parentChatId: bigint | string | null | undefined, studentName: string, debtAmount: number, groupName: string): Promise<void>;
    private startPolling;
    private handleUpdate;
}
