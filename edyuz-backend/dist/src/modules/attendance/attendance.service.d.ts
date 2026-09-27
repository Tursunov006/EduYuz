import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { TelegramService } from '../telegram/telegram.service';
import { SmsService } from '../sms/sms.service';
export declare class AttendanceService {
    private prisma;
    private telegramService;
    private smsService;
    constructor(prisma: PrismaService, telegramService: TelegramService, smsService: SmsService);
    markGroupAttendance(dto: MarkAttendanceDto, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findByGroupAndDate(groupId: string, date: string): Promise<({
        student: {
            id: string;
            phone: string;
            fullName: string;
        };
        marker: {
            id: string;
            phone: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        studentId: string;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        groupId: string;
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
        createdAt: Date;
        studentId: string;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        groupId: string;
        date: Date;
        markedBy: string | null;
    })[]>;
}
