"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExpensesService = class ExpensesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(centerId, category) {
        const where = {};
        if (centerId)
            where.centerId = centerId;
        if (category)
            where.category = category;
        return this.prisma.expense.findMany({
            where,
            orderBy: { paidAt: 'desc' },
        });
    }
    async create(dto) {
        let centerId = dto.centerId;
        if (!centerId) {
            const firstCenter = await this.prisma.center.findFirst();
            if (!firstCenter) {
                throw new common_1.NotFoundException("Markaz topilmadi");
            }
            centerId = firstCenter.id;
        }
        return this.prisma.expense.create({
            data: {
                centerId,
                title: dto.title,
                amount: dto.amount,
                category: dto.category || 'other',
                paymentMethod: dto.paymentMethod || 'cash',
                comment: dto.comment,
            },
        });
    }
    async delete(id) {
        const expense = await this.prisma.expense.findUnique({ where: { id } });
        if (!expense) {
            throw new common_1.NotFoundException("Xarajat topilmadi");
        }
        return this.prisma.expense.delete({ where: { id } });
    }
    async getSummary(centerId) {
        const whereCenter = centerId ? { centerId } : {};
        const payments = await this.prisma.payment.findMany({
            where: {
                amount: { gt: 0 },
                ...(centerId ? { student: { centerId } } : {}),
            },
            select: { amount: true, paidAt: true },
        });
        const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const expenses = await this.prisma.expense.findMany({
            where: whereCenter,
            select: { amount: true, category: true, paidAt: true },
        });
        const totalOperatingExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const salaries = await this.prisma.salaryPayment.findMany({
            where: centerId ? { teacher: { centerId } } : {},
            select: { amount: true },
        });
        const totalSalaryExpenses = salaries.reduce((sum, s) => sum + Number(s.amount), 0);
        const totalExpenses = totalOperatingExpenses + totalSalaryExpenses;
        const netProfit = totalIncome - totalExpenses;
        const categoryTotals = {
            salary: totalSalaryExpenses,
            rent: 0,
            utilities: 0,
            marketing: 0,
            equipment: 0,
            stationery: 0,
            tax: 0,
            other: 0,
        };
        expenses.forEach((e) => {
            const cat = e.category || 'other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount);
        });
        return {
            totalIncome,
            totalExpenses,
            totalOperatingExpenses,
            totalSalaryExpenses,
            netProfit,
            isProfitable: netProfit >= 0,
            categoryTotals,
            totalCount: expenses.length,
        };
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map