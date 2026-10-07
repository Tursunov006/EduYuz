import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateStudentDto): Promise<{
        id: string;
        phone: string | null;
        createdAt: Date;
        centerId: string;
        fullName: string;
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
                    createdAt: Date;
                    centerId: string;
                    title: string;
                    price: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                centerId: string;
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
        phone: string | null;
        createdAt: Date;
        centerId: string;
        fullName: string;
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
                teacher: {
                    id: string;
                    fullName: string;
                };
                course: {
                    id: string;
                    createdAt: Date;
                    centerId: string;
                    title: string;
                    price: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                centerId: string;
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
            createdAt: Date;
            status: import(".prisma/client").$Enums.AttendanceStatus;
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
        phone: string | null;
        createdAt: Date;
        centerId: string;
        fullName: string;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    }>;
    update(id: string, dto: UpdateStudentDto): Promise<{
        id: string;
        phone: string | null;
        createdAt: Date;
        centerId: string;
        fullName: string;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    }>;
    remove(id: string): Promise<{
        id: string;
        phone: string | null;
        createdAt: Date;
        centerId: string;
        fullName: string;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    }>;
}
