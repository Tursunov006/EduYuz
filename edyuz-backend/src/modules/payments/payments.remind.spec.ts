import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe("PaymentsService.remindDebt — qarzdorga Telegram eslatma", () => {
  const build = (student: any, sendOk = true) => {
    const prisma: any = { student: { findUnique: jest.fn().mockResolvedValue(student) } };
    const telegram: any = { sendDebtAlert: jest.fn().mockResolvedValue(sendOk) };
    return { svc: new PaymentsService(prisma, telegram, {} as any, { get: () => undefined } as any), telegram };
  };
  const base = { id: 's1', fullName: 'Ali', balance: -300000, groups: [{ group: { name: 'IT-01' } }] };

  it("ota-ona botga ulangan bo'lsa, eslatma yuboriladi", async () => {
    const { svc, telegram } = build({ ...base, parentChatId: 123n });
    const res = await svc.remindDebt('s1');
    expect(res.sent).toBe(true);
    expect(telegram.sendDebtAlert).toHaveBeenCalledWith(123n, 'Ali', -300000, 'IT-01');
  });

  it("botga ulanmagan bo'lsa, yuborilmaydi va sababi aytiladi", async () => {
    const { svc, telegram } = build({ ...base, parentChatId: null });
    const res = await svc.remindDebt('s1');
    expect(res.sent).toBe(false);
    expect(res.message).toMatch(/ulanmagan/);
    expect(telegram.sendDebtAlert).not.toHaveBeenCalled();
  });

  it("qarzi yo'q o'quvchiga eslatma yuborilmaydi", async () => {
    const { svc } = build({ ...base, balance: 0, parentChatId: 1n });
    await expect(svc.remindDebt('s1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Telegram xato qaytarsa, sent=false', async () => {
    const { svc } = build({ ...base, parentChatId: 5n }, false);
    expect((await svc.remindDebt('s1')).sent).toBe(false);
  });
});
