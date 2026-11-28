import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';

// Xotiradagi soxta baza: faqat shu servis ishlatadigan metodlar
function makeDb() {
  const rows: any[] = [];
  let n = 0;
  return {
    rows,
    loginChallenge: {
      deleteMany: jest.fn(async () => ({ count: 0 })),
      findFirst: jest.fn(async ({ where }: any) =>
        rows.find((r) => r.userId === where.userId && r.purpose === where.purpose && r.createdAt > where.createdAt.gt) || null,
      ),
      create: jest.fn(async ({ data }: any) => {
        const r = { id: 'c' + ++n, attempts: 0, createdAt: new Date(), ...data };
        rows.push(r);
        return r;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const r = rows.find((x) => x.id === where.id)!;
        if (data.attempts?.increment) r.attempts += data.attempts.increment;
        if (data.codeHash) r.codeHash = data.codeHash;
        return r;
      }),
      findUnique: jest.fn(async ({ where }: any) => rows.find((x) => x.id === where.id) || null),
      delete: jest.fn(async ({ where }: any) => {
        const i = rows.findIndex((x) => x.id === where.id);
        if (i >= 0) rows.splice(i, 1);
      }),
    },
  };
}

describe('TwoFactorService', () => {
  function make(sendOk = true) {
    const db = makeDb();
    const sent: string[] = [];
    const tg = { sendMessage: jest.fn(async (_c: any, text: string) => { sent.push(text); return sendOk; }) };
    const svc = new TwoFactorService(db as any, tg as any);
    const codeOf = () => /<code>(\d{6})<\/code>/.exec(sent[sent.length - 1])![1];
    return { svc, db, sent, codeOf };
  }

  it('to\'g\'ri kod xodim ID\'sini qaytaradi va bir marta ishlaydi', async () => {
    const { svc, codeOf } = make();
    const id = await svc.issue('u1', BigInt(5), 'login');
    const code = codeOf();
    await expect(svc.verify(id, code, 'login')).resolves.toBe('u1');
    await expect(svc.verify(id, code, 'login')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('noto\'g\'ri kod va noto\'g\'ri maqsad rad etiladi', async () => {
    const { svc, codeOf } = make();
    const id = await svc.issue('u1', BigInt(5), 'login');
    await expect(svc.verify(id, '000000' === codeOf() ? '111111' : '000000', 'login')).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(svc.verify(id, codeOf(), 'enable')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('5 marta xato urinishdan keyin to\'g\'ri kod ham ishlamaydi', async () => {
    const { svc, codeOf } = make();
    const id = await svc.issue('u1', BigInt(5), 'login');
    const wrong = codeOf() === '123456' ? '654321' : '123456';
    for (let i = 0; i < 5; i++) await expect(svc.verify(id, wrong, 'login')).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(svc.verify(id, codeOf(), 'login')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('30 soniya ichida ikkinchi kod so\'ralsa rad etiladi', async () => {
    const { svc } = make();
    await svc.issue('u1', BigInt(5), 'login');
    await expect(svc.issue('u1', BigInt(5), 'login')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Telegramga yuborib bo\'lmasa xato beradi va kod saqlanmaydi', async () => {
    const { svc, db } = make(false);
    await expect(svc.issue('u1', BigInt(5), 'login')).rejects.toBeInstanceOf(BadRequestException);
    expect(db.rows.length).toBe(0);
  });
});
