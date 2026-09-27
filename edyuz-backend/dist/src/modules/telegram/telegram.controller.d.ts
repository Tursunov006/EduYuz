import { TelegramService } from './telegram.service';
export declare class TelegramController {
    private readonly telegramService;
    constructor(telegramService: TelegramService);
    sendTestMessage(chatId: string, message: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
