import { GroupsService } from './groups.service';

describe('GroupsService.removeStudent', () => {
  it("guruhdan chiqarilganda bugungi va keyingi davomatini ham o'chiradi", async () => {
    const prisma: any = {
      groupStudent: { findUnique: jest.fn().mockResolvedValue({ groupId: 'g1', studentId: 's1' }), delete: jest.fn((a) => a) },
      attendance: { deleteMany: jest.fn((a) => a) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    const svc = new (GroupsService as any)(prisma, {}, {}, {});
    await svc.removeStudent('g1', 's1');
    const where = prisma.attendance.deleteMany.mock.calls[0][0].where;
    expect(where.groupId).toBe('g1');
    expect(where.studentId).toBe('s1');
    const now = new Date();
    expect(where.date.gte.toISOString().slice(0, 10)).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    );
    expect(prisma.groupStudent.delete).toHaveBeenCalled();
  });
});
