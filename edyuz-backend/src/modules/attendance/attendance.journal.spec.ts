import { AttendanceService } from './attendance.service';

describe('AttendanceService.getMonthlyJournal', () => {
  it("oy bo'yicha a'zolar va davomat yozuvlarini qaytaradi (guruhdan chiqqanlar ham)", async () => {
    const prisma: any = {
      group: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1', name: 'IT', days: ['Dush', 'Chor', 'Jum'],
          students: [{ student: { id: 's2', fullName: 'Vali' } }, { student: { id: 's1', fullName: 'Ali' } }],
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
    expect(res.students.map((s: any) => s.fullName)).toEqual(['Ali', 'Sobiq', 'Vali']);
    expect(res.records).toEqual([
      { studentId: 's1', date: '2026-11-02', status: 'present' },
      { studentId: 's3', date: '2026-11-04', status: 'absent' },
    ]);
    const where = prisma.attendance.findMany.mock.calls[0][0].where;
    expect(where.date.gte.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(where.date.lt.toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });
});
