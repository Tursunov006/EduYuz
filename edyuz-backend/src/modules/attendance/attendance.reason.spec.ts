import { AttendanceService } from './attendance.service';

// "Kelmadi" uchun sabab: faqat kelmaganda saqlanadi, boshqa holatda tozalanadi
describe('AttendanceService — kelmaslik sababi', () => {
  const run = async (records: any[]) => {
    const prisma: any = {
      group: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', name: 'IT' }) },
      groupStudent: { findMany: jest.fn().mockResolvedValue(records.map((r) => ({ studentId: r.studentId, student: { status: 'active' } }))) },
      attendance: { findMany: jest.fn().mockResolvedValue([]), upsert: jest.fn((a) => a) },
      student: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    const svc = new (AttendanceService as any)(prisma, {}, {});
    await svc.markGroupAttendance({ groupId: 'g1', date: '2026-11-24', records }, 'u1');
    return prisma.attendance.upsert.mock.calls.map((c: any) => c[0]);
  };

  it("kelmaganda sabab saqlanadi, kelganda va kechikkanda saqlanmaydi", async () => {
    const calls = await run([
      { studentId: 'a', status: 'absent', reason: '  Kasal  ' },
      { studentId: 'b', status: 'present', reason: 'xato yuborilgan' },
      { studentId: 'c', status: 'late', reason: 'ham saqlanmaydi' },
      { studentId: 'd', status: 'absent' },
    ]);
    const by = Object.fromEntries(calls.map((c: any) => [c.create.studentId, c]));
    expect(by.a.create.reason).toBe('Kasal');
    expect(by.a.update.reason).toBe('Kasal');
    expect(by.b.create.reason).toBeNull();
    expect(by.b.update.reason).toBeNull(); // holat o'zgarsa eski sabab o'chadi
    expect(by.c.create.reason).toBeNull();
    expect(by.d.create.reason).toBeNull();
  });

  // Telegram: o'qituvchi izohi ota-onaga ketadi; holat o'zgarmasa ham, yangi sabab yozilsa xabar boradi
  const runNotify = async (prev: any[], records: any[]) => {
    const prisma: any = {
      group: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', name: 'IT' }) },
      groupStudent: { findMany: jest.fn().mockResolvedValue(records.map((r) => ({ studentId: r.studentId, student: { status: 'active' } }))) },
      attendance: { findMany: jest.fn().mockResolvedValue(prev), upsert: jest.fn((a) => a) },
      student: { findMany: jest.fn().mockImplementation(({ where }) => Promise.resolve(where.id.in.map((id: string) => ({ id, fullName: 'Ali', parentChatId: BigInt(1), parentPhone: null })))) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    const telegram: any = { sendAttendanceAlert: jest.fn().mockResolvedValue(undefined) };
    const sms: any = { sendAttendanceAlert: jest.fn().mockResolvedValue(undefined) };
    const svc = new (AttendanceService as any)(prisma, telegram, sms);
    await svc.markGroupAttendance({ groupId: 'g1', date: '2026-11-24', records }, 'u1');
    return telegram.sendAttendanceAlert.mock.calls;
  };

  it("kelmadi + sabab: Telegram'ga sabab ham uzatiladi", async () => {
    const calls = await runNotify([], [{ studentId: 'a', status: 'absent', reason: 'Kasal' }]);
    expect(calls).toHaveLength(1);
    expect(calls[0][5]).toBe('Kasal');
  });

  it("holat o'zgarmagan bo'lsa ham yangi sabab yozilganda xabar boradi, o'zgarmasa bormaydi", async () => {
    const withNewReason = await runNotify(
      [{ studentId: 'a', status: 'absent', reason: null }],
      [{ studentId: 'a', status: 'absent', reason: 'Safarda' }],
    );
    expect(withNewReason).toHaveLength(1);
    const unchanged = await runNotify(
      [{ studentId: 'a', status: 'absent', reason: 'Safarda' }],
      [{ studentId: 'a', status: 'absent', reason: 'Safarda' }],
    );
    expect(unchanged).toHaveLength(0);
  });
});
