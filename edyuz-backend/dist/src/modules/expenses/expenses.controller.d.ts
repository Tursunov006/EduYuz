import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class ExpensesController {
    private readonly expensesService;
    private readonly access;
    constructor(expensesService: ExpensesService, access: AccessService);
    getSummary(user: AuthUser, centerId?: string): Promise<{
        totalIncome: number;
        totalExpenses: number;
        totalOperatingExpenses: number;
        totalSalaryExpenses: number;
        netProfit: number;
        isProfitable: boolean;
        categoryTotals: Record<string, number>;
        totalCount: number;
    }>;
    findAll(user: AuthUser, centerId?: string, category?: string): Promise<{
        id: string;
        centerId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
    }[]>;
    create(dto: CreateExpenseDto, user: AuthUser): Promise<{
        id: string;
        centerId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
    }>;
    delete(id: string, user: AuthUser): Promise<{
        id: string;
        centerId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        paymentMethod: import(".prisma/client").$Enums.PaymentType;
        paidAt: Date;
        comment: string | null;
    }>;
}
