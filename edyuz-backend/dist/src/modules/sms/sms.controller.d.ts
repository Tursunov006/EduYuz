import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
export declare class SmsController {
    private readonly smsService;
    constructor(smsService: SmsService);
    sendSms(dto: SendSmsDto): Promise<{
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
