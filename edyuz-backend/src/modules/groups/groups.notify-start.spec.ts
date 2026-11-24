import { GroupsService } from './groups.service';

describe('GroupsService.notifyLessonStart', () => {
  const mk = (students: any[]) => {
    const prisma: any = {
      group: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', name: 'IT <01>', startTime: '18:00', students: students.map((student) => ({ student })) }) },
    };
    const telegram: any = { sendMessage: jest.fn().mockResolvedValue(true) };
    return { svc: new GroupsService(prisma, telegram), telegram };
  };

  it("faqat faol va Telegram'ga ulangan ota-onalarga yuboradi, qolganini sanaydi", async () => {
    const { svc, telegram } = mk([
      { id: 'a', fullName: 'Ali', status: 'active', parentChatId: BigInt(11) },
      { id: 'b', fullName: 'Vali', status: 'active', parentChatId: null },
      { id: 'c', fullName: 'Sami', status: 'dropped', parentChatId: BigInt(33) },
      { id: 'd', fullName: 'Hasan', status: 'inactive', parentChatId: BigInt(44) },
    ]);
    const r = await svc.notifyLessonStart('g1');
    expect(r).toMatchObject({ sent: 1, failed: 0, noTelegram: 1, total: 2 });
    expect(telegram.sendMessage).toHaveBeenCalledTimes(1);
    const [chat, text] = telegram.sendMessage.mock.calls[0];
    expect(String(chat)).toBe('11');
    expect(text).toContain('Ali');
    expect(text).toContain('18:00');
    expect(text).toContain('IT &lt;01&gt;'); // HTML xavfsiz
  });

  it("Telegram xato qaytarsa 'failed' sanaladi", async () => {
    const { svc, telegram } = mk([{ id: 'a', fullName: 'Ali', status: 'active', parentChatId: BigInt(11) }]);
    telegram.sendMessage.mockResolvedValue(false);
    const r = await svc.notifyLessonStart('g1');
    expect(r).toMatchObject({ sent: 0, failed: 1 });
  });
});
