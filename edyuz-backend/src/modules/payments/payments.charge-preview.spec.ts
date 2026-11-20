import { PaymentsService } from './payments.service';

describe("PaymentsService.chargeMonthly — oldindan ko'rish, xabar va bekor qilish", () => {
  const build = (students: any[], existing: any = null) => {
    const prisma: any = {
      group: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'g1', name: 'IT', course: { price: 600000 }, students: students.map((s) => ({ student: s })) },
        ]),
        findFirst: jest.fn().mockResolvedValue({ id: 'g1', name: 'IT' }),
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue(existing),
        findMany: jest.fn().mockResolvedValue([
          { id: 'p1', studentId: 'a', amount: -600000 },
          { id: 'p2', studentId: 'b', amount: -400000 },
        ]),
        create: jest.fn((a) => a),
        delete: jest.fn((a) => a),
      },
      student: { update: jest.fn((a) => ({ balance: -100 })) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    const telegram: any = { sendDebtAlert: jest.fn().mockResolvedValue(true) };
    const sms: any = { sendDebtAlert: jest.fn().mockResolvedValue(true) };
    const svc = new PaymentsService(prisma, telegram, sms, { get: () => undefined } as any);
    return { svc, prisma, telegram, sms };
  };
  const students = [
    { id: 'a', fullName: 'Ali', status: 'active', discount: 0, discountAmount: 0, parentChatId: 1n, parentPhone: '+998' },
    { id: 'b', fullName: 'Vali', status: 'active', discount: 0, discountAmount: 200000 },
    { id: 'c', fullName: 'Sobiq', status: 'dropped' },
    { id: 'd', fullName: 'Grant', status: 'active', discount: 100 },
  ];

  it("dryRun: hech narsa yozilmaydi, har bir o'quvchi summasi qaytadi", async () => {
    const { svc, prisma } = build(students);
    const res = await svc.chargeMonthly('center', undefined, { dryRun: true });
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(prisma.student.update).not.toHaveBeenCalled();
    expect(res.items.map((i) => [i.fullName, i.amount, i.status])).toEqual([
      ['Ali', 600000, 'charge'],
      ['Vali', 400000, 'charge'],
      ['Grant', 0, 'free'],
    ]);
    expect(res.totalCharged).toBe(1000000);
  });

  it("notify berilmasa ota-onaga xabar yuborilmaydi", async () => {
    const { svc, telegram, sms } = build(students);
    await svc.chargeMonthly('center');
    expect(telegram.sendDebtAlert).not.toHaveBeenCalled();
    expect(sms.sendDebtAlert).not.toHaveBeenCalled();
  });

  it('notify=true bo‘lsa qarzdorga xabar yuboriladi', async () => {
    const { svc, telegram } = build(students);
    await svc.chargeMonthly('center', undefined, { notify: true });
    expect(telegram.sendDebtAlert).toHaveBeenCalledTimes(1);
  });

  it("bu oy avval yechilgan bo'lsa 'already' va qayta yechilmaydi", async () => {
    const { svc, prisma } = build(students, { id: 'x' });
    const res = await svc.chargeMonthly('center');
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(res.items.filter((i) => i.status === 'already')).toHaveLength(2);
  });

  it("bekor qilish: shu oydagi yechishlar o'chiriladi va balansga qaytariladi", async () => {
    const { svc, prisma } = build(students);
    const res = await svc.cancelMonthlyCharge('center', 'g1');
    expect(prisma.payment.delete).toHaveBeenCalledTimes(2);
    expect(prisma.student.update.mock.calls.map((c) => c[0].data.balance.decrement)).toEqual([-600000, -400000]);
    expect(res).toMatchObject({ cancelled: 2, refunded: 1000000 });
  });
});
