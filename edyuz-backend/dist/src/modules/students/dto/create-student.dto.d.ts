import { StudentStatus } from '@prisma/client';
export declare class CreateStudentDto {
    centerId: string;
    fullName: string;
    phone?: string;
    parentPhone: string;
    parentChatId?: bigint | number | string;
    balance?: number;
    status?: StudentStatus;
}
