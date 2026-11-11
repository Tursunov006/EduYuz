import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
export declare class ExpensesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(centerId?: string, category?: any): Promise<{
        id: string;
        centerId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
    }[]>;
    create(dto: CreateExpenseDto): Promise<{
        id: string;
        centerId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        centerId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
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
