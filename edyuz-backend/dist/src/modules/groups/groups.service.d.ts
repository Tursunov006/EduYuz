import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentToGroupDto } from './dto/add-student.dto';
export declare class GroupsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateGroupDto): Promise<{
        teacher: {
            id: string;
            phone: string;
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
    }>;
    findAll(centerId?: string, courseId?: string, teacherId?: string): Promise<({
        _count: {
            students: number;
        };
        teacher: {
            id: string;
            phone: string;
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
    })[]>;
    findOne(id: string): Promise<{
        students: ({
            student: {
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
            };
        } & {
            studentId: string;
            groupId: string;
            joinedAt: Date;
        })[];
        teacher: {
            id: string;
            phone: string;
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
    }>;
    update(id: string, dto: UpdateGroupDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        centerId: string;
        courseId: string;
        teacherId: string;
        days: import("@prisma/client/runtime/library").JsonValue;
        startTime: string;
        endTime: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        centerId: string;
        courseId: string;
        teacherId: string;
        days: import("@prisma/client/runtime/library").JsonValue;
        startTime: string;
        endTime: string;
    }>;
    addStudent(groupId: string, dto: AddStudentToGroupDto): Promise<{
        student: {
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
        };
    } & {
        studentId: string;
        groupId: string;
        joinedAt: Date;
    }>;
    removeStudent(groupId: string, studentId: string): Promise<{
        studentId: string;
        groupId: string;
        joinedAt: Date;
    }>;
}
