import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class AttendanceController {
    private readonly attendanceService;
    private readonly access;
    constructor(attendanceService: AttendanceService, access: AccessService);
    faceScan(image: string, user: AuthUser): Promise<{
        success: boolean;
        message: string;
        name: string;
    }>;
    markAttendance(dto: MarkAttendanceDto, user: AuthUser): Promise<{
        success: boolean;
        message: string;
    }>;
    findByGroupAndDate(groupId: string, date: string, user: AuthUser): Promise<({
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
        status: import(".prisma/client").$Enums.AttendanceStatus;
        studentId: string;
        groupId: string;
        date: Date;
        markedBy: string | null;
    })[]>;
    getStudentAttendance(studentId: string, user?: AuthUser): Promise<({
        group: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        studentId: string;
        groupId: string;
        date: Date;
        markedBy: string | null;
    })[]>;
}
