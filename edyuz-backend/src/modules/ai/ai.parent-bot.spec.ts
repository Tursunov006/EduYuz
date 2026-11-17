import { AiService } from './ai.service';

describe('AiService.chatParentBot — soxta ma\'lumotlarsiz', () => {
  const svc = new AiService({ get: () => undefined } as any);
  const ctx = {
    student: { fullName: 'Ali' },
    groupInfo: { name: 'IT-01', course: { title: 'IT' }, teacher: { fullName: 'Ustoz A', phone: '+998916332233' } },
    teacher: { fullName: 'Ustoz A', phone: '+998916332233' },
    center: { name: 'Aksioma IT Education Center', phone: '+998901112233' },
    allCourses: [{ title: 'IT', price: 600000 }],
  };

  it('ustoz haqida: haqiqiy telefon, "EduYuz AI" va "darhol yetkazadi" degan va\'da yo\'q', async () => {
    const r = await svc.chatParentBot('ustoz telefoni', ctx);
    expect(r).toContain('+998916332233');
    expect(r).not.toContain('EduYuz');
    expect(r).not.toContain('darhol ustozga yetkazadi');
  });

  it('markaz haqida: markazning o\'z nomi va kurslari, soxta manzil/telefon yo\'q', async () => {
    const r = await svc.chatParentBot('markaz kurslari', ctx);
    expect(r).toContain('Aksioma IT Education Center');
    expect(r).toContain('IT');
    expect(r).not.toContain('+998 71 200 00 00');
    expect(r).not.toContain('Markaziy bino');
  });
});
