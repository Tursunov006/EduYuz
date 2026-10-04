import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
export declare class TeachersController {
    private readonly teachersService;
    constructor(teachersService: TeachersService);
    findAll(centerId?: string): Promise<{
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
            paidAt: Date;
            paymentMethod: import(".prisma/client").$Enums.PaymentType;
            comment: string | null;
            periodMonth: string;
        }[];
    }[]>;
    findOne(id: string): Promise<{
        groups: ({
            course: {
                id: string;
                title: string;
                createdAt: Date;
                centerId: string;
                price: import("@prisma/client/runtime/library").Decimal;
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
        })[];
        salaryPayments: {
            id: string;
            teacherId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date;
            paymentMethod: import(".prisma/client").$Enums.PaymentType;
            comment: string | null;
            periodMonth: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        phone: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.RoleType;
        specialty: string | null;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    create(dto: CreateTeacherDto): Promise<{
        id: string;
        createdAt: Date;
        fullName: string;
        phone: string;
        specialty: string;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateTeacherDto): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        phone: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.RoleType;
        specialty: string | null;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        phone: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.RoleType;
        specialty: string | null;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    paySalary(id: string, dto: PaySalaryDto): Promise<{
        id: string;
        teacherId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
        periodMonth: string;
    }>;
    getSalaryHistory(id: string): Promise<{
        id: string;
        teacherId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
        periodMonth: string;
    }[]>;
}
