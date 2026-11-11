import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class TeachersController {
    private readonly teachersService;
    private readonly access;
    constructor(teachersService: TeachersService, access: AccessService);
    findAll(user: AuthUser, centerId?: string): Promise<{
        id: string;
        centerId: string;
        fullName: string;
        phone: string;
        specialty: string;
        salaryType: string;
        salaryRate: number;
        isActive: boolean;
        createdAt: Date;
        groups: {
            id: string;
            name: string;
            courseTitle: string;
            coursePrice: number;
            studentCount: number;
            days: import("@prisma/client/runtime/library").JsonValue;
            time: string;
        }[];
        totalGroups: number;
        totalStudents: number;
        monthlyGrossRevenue: number;
        expectedMonthlySalary: number;
        currentMonthPaid: number;
        remainingSalary: number;
        currentPeriod: string;
        recentPayments: {
            id: string;
            teacherId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentType;
            paidAt: Date;
            comment: string | null;
            periodMonth: string;
        }[];
    }[]>;
    findOne(id: string, user: AuthUser): Promise<{
        groups: ({
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
        })[];
        salaryPayments: {
            id: string;
            teacherId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentType;
            paidAt: Date;
            comment: string | null;
            periodMonth: string;
        }[];
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        specialty: string | null;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    create(dto: CreateTeacherDto, user: AuthUser): Promise<{
        temporaryPassword: string;
        id: string;
        phone: string;
        createdAt: Date;
        fullName: string;
        specialty: string;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateTeacherDto, user: AuthUser): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        specialty: string;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    delete(id: string, user: AuthUser): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        specialty: string;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    paySalary(id: string, dto: PaySalaryDto, user: AuthUser): Promise<{
        id: string;
        teacherId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        periodMonth: string;
    }>;
    getSalaryHistory(id: string, user: AuthUser): Promise<{
        id: string;
        teacherId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
        periodMonth: string;
    }[]>;
}
