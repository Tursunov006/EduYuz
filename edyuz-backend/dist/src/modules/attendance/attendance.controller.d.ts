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
        groupId: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
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
        groupId: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        studentId: string;
        date: Date;
        markedBy: string | null;
    })[]>;
}
