import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(centerId?: string, category?: any) {
    const where: any = {};
    if (centerId) where.centerId = centerId;
    if (category) where.category = category;

    return this.prisma.expense.findMany({
      where,
      orderBy: { paidAt: 'desc' },
    });
  }

  async create(dto: CreateExpenseDto) {
    let centerId = dto.centerId;
    if (!centerId) {
      const firstCenter = await this.prisma.center.findFirst();
      if (!firstCenter) {
        throw new NotFoundException("Markaz topilmadi");
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

  async delete(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new NotFoundException("Xarajat topilmadi");
    }

    return this.prisma.expense.delete({ where: { id } });
  }

  async getSummary(centerId?: string) {
    const whereCenter = centerId ? { centerId } : {};

    // 1. Jami tushum (Kirim - faqat haqiqiy tushgan to'lovlar)
    const payments = await this.prisma.payment.findMany({
      where: {
        amount: { gt: 0 },
        ...(centerId ? { student: { centerId } } : {}),
      },
      select: { amount: true, paidAt: true },
    });
    const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // 2. Operatsion xarajatlar (Chiqim - Expenses)
    const expenses = await this.prisma.expense.findMany({
      where: whereCenter,
      select: { amount: true, category: true, paidAt: true },
    });
    const totalOperatingExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // 3. O'qituvchilarga to'langan oyliklar
    const salaries = await this.prisma.salaryPayment.findMany({
      where: centerId ? { teacher: { centerId } } : {},
      select: { amount: true },
    });
    const totalSalaryExpenses = salaries.reduce((sum, s) => sum + Number(s.amount), 0);

    // Jami Chiqim va Sof Foyda
    const totalExpenses = totalOperatingExpenses + totalSalaryExpenses;
    const netProfit = totalIncome - totalExpenses;

    // Kategoriyalar bo'yicha taqsimot
    const categoryTotals: Record<string, number> = {
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
}
