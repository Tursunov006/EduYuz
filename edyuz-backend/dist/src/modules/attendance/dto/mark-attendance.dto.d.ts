import { AttendanceStatus } from '@prisma/client';
export declare class AttendanceRecordDto {
    studentId: string;
    status: AttendanceStatus;
}
export declare class MarkAttendanceDto {
    groupId: string;
    date: string;
    records: AttendanceRecordDto[];
}
