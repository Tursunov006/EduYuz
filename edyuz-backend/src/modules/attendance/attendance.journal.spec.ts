import { AttendanceService } from './attendance.service';

describe('AttendanceService.getMonthlyJournal', () => {
  it("faqat hozirgi faol a'zolar va ularning davomatini qaytaradi", async () => {
    const prisma: any = {
      group: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1', name: 'IT', days: ['Dush', 'Chor', 'Jum'],
          students: [
            { student: { id: 's2', fullName: 'Vali', status: 'active' } },
            { student: { id: 's1', fullName: 'Ali', status: 'active' } },
            { student: { id: 's4', fullName: 'Arxivdagi', status: 'inactive' } },
            { student: { id: 's5', fullName: 'Bobur', status: 'dropped' } },
          ],
        }),
      },
      attendance: {
        findMany: jest.fn().mockResolvedValue([
          { studentId: 's1', date: new Date('2026-11-02T00:00:00Z'), status: 'present', student: { id: 's1', fullName: 'Ali' } },
          { studentId: 's3', date: new Date('2026-11-04T00:00:00Z'), status: 'absent', student: { id: 's3', fullName: 'Sobiq' } },
        ]),
      },
    };
    const svc = new (AttendanceService as any)(prisma, {}, {}, {}, {});
    const res = await svc.getMonthlyJournal('g1', '2026-11');
    expect(res.month).toBe('2026-11');
    // s3 guruhdan chiqarilgan, s4 arxivda — ko'rsatilmaydi; s5 "Kelmagan" — guruhda qoladi
    expect(res.students.map((s: any) => s.fullName)).toEqual(['Ali', 'Bobur', 'Vali']);
    expect(res.records).toEqual([{ studentId: 's1', date: '2026-11-02', status: 'present' }]);
    const where = prisma.attendance.findMany.mock.calls[0][0].where;
    expect(where.date.gte.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(where.date.lt.toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });
});
