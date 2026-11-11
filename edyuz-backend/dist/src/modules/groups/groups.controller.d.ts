import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentToGroupDto } from './dto/add-student.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class GroupsController {
    private readonly groupsService;
    private readonly access;
    constructor(groupsService: GroupsService, access: AccessService);
    create(dto: CreateGroupDto, user: AuthUser): Promise<{
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
    findAll(user: AuthUser, centerId?: string, courseId?: string, teacherId?: string): Promise<({
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
    findOne(id: string, user: AuthUser): Promise<{
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
    update(id: string, dto: UpdateGroupDto, user: AuthUser): Promise<{
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
    remove(id: string, user: AuthUser): Promise<{
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
    addStudent(groupId: string, dto: AddStudentToGroupDto, user: AuthUser): Promise<{
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
    removeStudent(groupId: string, studentId: string, user: AuthUser): Promise<{
        studentId: string;
        groupId: string;
        joinedAt: Date;
    }>;
}
