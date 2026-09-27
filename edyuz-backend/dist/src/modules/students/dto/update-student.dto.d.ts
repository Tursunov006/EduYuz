import { StudentStatus } from '@prisma/client';
export declare class UpdateStudentDto {
    fullName?: string;
    phone?: string;
    parentPhone?: string;
    parentChatId?: bigint | number | string;
    balance?: number;
    status?: StudentStatus;
}
