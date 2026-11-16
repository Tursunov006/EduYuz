import { PaymentsService } from './payments.service';

describe('PaymentsService.chargeMonthly — chegirma', () => {
  const build = (students: any[]) => {
    const created: any[] = [];
    const prisma: any = {
      group: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'g1', name: 'IT', course: { price: 600000 }, students: students.map((s) => ({ student: s })) },
        ]),
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn((a) => { created.push(a.data); return a; }),
      },
      student: { update: jest.fn((a) => ({ balance: 0 - a.data.balance.decrement })) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    const svc = new PaymentsService(prisma, {} as any, {} as any, { get: () => undefined } as any);
    return { svc, created };
  };

  it("chegirma foizini oylik to'lovdan ayiradi, 100% bo'lsa yechmaydi", async () => {
    const { svc, created } = build([
      { id: 'a', status: 'active', discount: 0 },
      { id: 'b', status: 'active', discount: 25 },
      { id: 'c', status: 'active', discount: 100 },
    ]);
    const res = await svc.chargeMonthly('center');
    expect(created.map((c) => c.amount)).toEqual([-600000, -450000]);
    expect(created[1].comment).toContain('chegirma 25%');
    expect(res.totalCharged).toBe(1050000);
    expect(res.count).toBe(2);
  });
});
