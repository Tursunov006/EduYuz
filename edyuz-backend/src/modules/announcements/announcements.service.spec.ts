import { NotFoundException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

describe("AnnouncementsService — e'lonlar", () => {
  const build = (ann: any, students: any[] = []) => {
    const prisma: any = {
      announcement: {
        create: jest.fn((a) => ({ id: 'a1', ...a.data })),
        findFirst: jest.fn().mockResolvedValue(ann),
        update: jest.fn((a) => a),
        delete: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      student: { findMany: jest.fn().mockResolvedValue(students) },
    };
    const telegram: any = { sendMessage: jest.fn().mockResolvedValue(true) };
    return { svc: new AnnouncementsService(prisma, telegram), prisma, telegram };
  };
  const ann = { id: 'a1', centerId: 'c1', title: 'Dam <olish>', content: 'Ertaga dars yo‘q', target: 'all', priority: 'high' };

  it("Telegram belgilanmasa faqat saqlanadi, hech kimga yuborilmaydi", async () => {
    const { svc, telegram } = build(ann, [{ parentChatId: 1n }]);
    const res = await svc.create('c1', 'Admin', { title: 'X', content: 'Y' });
    expect(res.sent).toBe(0);
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('botga ulangan ota-onalarga (takrorsiz) yuboriladi, HTML qochiriladi', async () => {
    const { svc, telegram, prisma } = build(ann, [{ parentChatId: 1n }, { parentChatId: 1n }, { parentChatId: 2n }]);
    const res = await svc.send('c1', 'a1');
    expect(res.sent).toBe(2);
    expect(telegram.sendMessage.mock.calls[0][1]).toContain('Dam &lt;olish&gt;');
    expect(prisma.student.findMany.mock.calls[0][0].where).toMatchObject({ centerId: 'c1', status: { not: 'inactive' } });
  });

  it("o'qituvchilar uchun e'lon Telegramga yuborilmaydi", async () => {
    const { svc, telegram } = build({ ...ann, target: 'teachers' }, [{ parentChatId: 1n }]);
    expect((await svc.send('c1', 'a1')).sent).toBe(0);
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it("boshqa markaz e'loni topilmaydi", async () => {
    const { svc } = build(null);
    await expect(svc.remove('c2', 'a1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
