import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    create(dto: CreateStudentDto): Promise<{
        id: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
        createdAt: Date;
        centerId: string;
    }>;
    findAll(centerId?: string, search?: string): Promise<({
        groups: ({
            group: {
                course: {
                    id: string;
                    createdAt: Date;
                    centerId: string;
                    title: string;
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
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
        createdAt: Date;
        centerId: string;
    })[]>;
    findOne(id: string): Promise<{
        groups: ({
            group: {
                course: {
                    id: string;
                    createdAt: Date;
                    centerId: string;
                    title: string;
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
            status: import(".prisma/client").$Enums.AttendanceStatus;
            createdAt: Date;
            groupId: string;
            studentId: string;
            date: Date;
            markedBy: string | null;
        }[];
        payments: {
            id: string;
            studentId: string;
            paidAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentType;
            comment: string | null;
        }[];
    } & {
        id: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
        createdAt: Date;
        centerId: string;
    }>;
    update(id: string, dto: UpdateStudentDto): Promise<{
        id: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
        createdAt: Date;
        centerId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        fullName: string;
        phone: string | null;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
        createdAt: Date;
        centerId: string;
    }>;
}
