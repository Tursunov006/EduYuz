import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    faceScan(image: string): Promise<{
        success: boolean;
        message: string;
        name: string;
    }>;
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
