import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
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
    findAll(centerId?: string, category?: any): Promise<{
        id: string;
        centerId: string;
        title: string;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
        category: import(".prisma/client").$Enums.ExpenseCategory;
    }[]>;
    create(dto: CreateExpenseDto): Promise<{
        id: string;
        centerId: string;
        title: string;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
        category: import(".prisma/client").$Enums.ExpenseCategory;
    }>;
    delete(id: string): Promise<{
        id: string;
        centerId: string;
        title: string;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        comment: string | null;
        category: import(".prisma/client").$Enums.ExpenseCategory;
    }>;
}
