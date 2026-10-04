import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
export declare class ExpensesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(centerId?: string, category?: any): Promise<{
        id: string;
        title: string;
        centerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
        category: import(".prisma/client").$Enums.ExpenseCategory;
    }[]>;
    create(dto: CreateExpenseDto): Promise<{
        id: string;
        title: string;
        centerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
        category: import(".prisma/client").$Enums.ExpenseCategory;
    }>;
    delete(id: string): Promise<{
        id: string;
        title: string;
        centerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
        category: import(".prisma/client").$Enums.ExpenseCategory;
    }>;
    getSummary(centerId?: string): Promise<{
        totalIncome: number;
        totalExpenses: number;
        totalOperatingExpenses: number;
        totalSalaryExpenses: number;
        netProfit: number;
        isProfitable: boolean;
        categoryTotals: Record<string, number>;
        totalCount: number;
    }>;
}
