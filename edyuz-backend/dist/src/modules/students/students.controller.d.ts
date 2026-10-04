import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    create(dto: CreateStudentDto): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    }>;
    findAll(centerId?: string, search?: string): Promise<({
        groups: ({
            group: {
                course: {
                    id: string;
                    title: string;
                    createdAt: Date;
                    centerId: string;
                    price: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                createdAt: Date;
                centerId: string;
                name: string;
                courseId: string;
                teacherId: string;
                days: import("@prisma/client/runtime/library").JsonValue;
                startTime: string;
                endTime: string;
            };
        } & {
            groupId: string;
            studentId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    })[]>;
    findOne(id: string): Promise<{
        groups: ({
            group: {
                course: {
                    id: string;
                    title: string;
                    createdAt: Date;
                    centerId: string;
                    price: import("@prisma/client/runtime/library").Decimal;
                };
                teacher: {
                    id: string;
                    fullName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                centerId: string;
                name: string;
                courseId: string;
                teacherId: string;
                days: import("@prisma/client/runtime/library").JsonValue;
                startTime: string;
                endTime: string;
            };
        } & {
            groupId: string;
            studentId: string;
            joinedAt: Date;
        })[];
        attendances: {
            id: string;
            groupId: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.AttendanceStatus;
            studentId: string;
            date: Date;
            markedBy: string | null;
        }[];
        payments: {
            id: string;
            studentId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date;
            paymentMethod: import(".prisma/client").$Enums.PaymentType;
            comment: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    }>;
    update(id: string, dto: UpdateStudentDto): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    }>;
}
