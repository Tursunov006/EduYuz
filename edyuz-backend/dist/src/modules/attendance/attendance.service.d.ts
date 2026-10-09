import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { TelegramService } from '../telegram/telegram.service';
import { SmsService } from '../sms/sms.service';
export declare class AttendanceService {
    private prisma;
    private telegramService;
    private smsService;
    constructor(prisma: PrismaService, telegramService: TelegramService, smsService: SmsService);
    processFaceScan(imageBase64: string): Promise<{
        success: boolean;
        message: string;
        name: string;
    }>;
    markGroupAttendance(dto: MarkAttendanceDto, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findByGroupAndDate(groupId: string, date: string): Promise<({
        student: {
            id: string;
            fullName: string;
            phone: string;
        };
        marker: {
            id: string;
            fullName: string;
            phone: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        groupId: string;
        studentId: string;
        date: Date;
        markedBy: string | null;
    })[]>;
    getStudentAttendance(studentId: string): Promise<({
        group: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        groupId: string;
        studentId: string;
        date: Date;
        markedBy: string | null;
    })[]>;
}
