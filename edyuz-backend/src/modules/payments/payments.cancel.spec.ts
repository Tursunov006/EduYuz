import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe("PaymentsService.cancel — to'lovni bekor qilish", () => {
  const build = (payment: any) => {
    const prisma: any = {
      payment: { findUnique: jest.fn().mockResolvedValue(payment), delete: jest.fn((a) => a) },
      student: { update: jest.fn((a) => ({ balance: 100000 - a.data.balance.decrement })) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    return { svc: new PaymentsService(prisma, {} as any, {} as any, { get: () => undefined } as any), prisma };
  };

  it("naqd to'lov bekor qilinsa, summasi balansdan qaytariladi", async () => {
    const { svc, prisma } = build({ id: 'p1', studentId: 's1', amount: 300000, paymentMethod: 'cash' });
    const res = await svc.cancel('p1');
    expect(prisma.student.update.mock.calls[0][0].data.balance.decrement).toBe(300000);
    expect(res).toEqual({ cancelled: true, newBalance: -200000 });
  });

  it("oylik yechish (manfiy) bekor qilinsa, balansga qaytib qo'shiladi", async () => {
    const { svc, prisma } = build({ id: 'p2', studentId: 's1', amount: -450000, paymentMethod: 'cash' });
    await svc.cancel('p2');
    expect(prisma.student.update.mock.calls[0][0].data.balance.decrement).toBe(-450000);
  });

  it("Click/Payme to'lovini bekor qilmaydi", async () => {
    const { svc, prisma } = build({ id: 'p3', studentId: 's1', amount: 100000, paymentMethod: 'click' });
    await expect(svc.cancel('p3')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.payment.delete).not.toHaveBeenCalled();
  });
});
