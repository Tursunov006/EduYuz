import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class StudentsController {
    private readonly studentsService;
    private readonly access;
    constructor(studentsService: StudentsService, access: AccessService);
    create(dto: CreateStudentDto, user: AuthUser): Promise<{
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
    findAll(user: AuthUser, centerId?: string, search?: string): Promise<({
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
            studentId: string;
            groupId: string;
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
    findOne(id: string, user?: AuthUser): Promise<any>;
    update(id: string, dto: UpdateStudentDto, user: AuthUser): Promise<{
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
    remove(id: string, user: AuthUser): Promise<{
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
