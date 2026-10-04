import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentToGroupDto } from './dto/add-student.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    create(dto: CreateGroupDto): Promise<{
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
            phone: string;
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
    }>;
    findAll(centerId?: string, courseId?: string, teacherId?: string): Promise<({
        _count: {
            students: number;
        };
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
            phone: string;
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
    })[]>;
    findOne(id: string): Promise<{
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
            phone: string;
        };
        students: ({
            student: {
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
        name: string;
        courseId: string;
        teacherId: string;
        days: import("@prisma/client/runtime/library").JsonValue;
        startTime: string;
        endTime: string;
    }>;
    update(id: string, dto: UpdateGroupDto): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        name: string;
        courseId: string;
        teacherId: string;
        days: import("@prisma/client/runtime/library").JsonValue;
        startTime: string;
        endTime: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        name: string;
        courseId: string;
        teacherId: string;
        days: import("@prisma/client/runtime/library").JsonValue;
        startTime: string;
        endTime: string;
    }>;
    addStudent(groupId: string, dto: AddStudentToGroupDto): Promise<{
        student: {
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
        };
    } & {
        groupId: string;
        studentId: string;
        joinedAt: Date;
    }>;
    removeStudent(groupId: string, studentId: string): Promise<{
        groupId: string;
        studentId: string;
        joinedAt: Date;
    }>;
}
