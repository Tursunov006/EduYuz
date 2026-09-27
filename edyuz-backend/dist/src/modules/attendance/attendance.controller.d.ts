import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    markAttendance(dto: MarkAttendanceDto, userId: string): Promise<{
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
