import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

function make(user: any, issueImpl?: () => Promise<string>) {
  const users = user ? [{ ...user }] : [];
  const prisma: any = {
    user: {
      findUnique: jest.fn(async ({ where }: any) => users.find((u) => (where.phone ? u.phone === where.phone : u.id === where.id)) || null),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const u = users.find((x) => x.id === where.id && (where.isActive === undefined || x.isActive === where.isActive));
        if (u) Object.assign(u, data);
        return { count: u ? 1 : 0 };
      }),
    },
  };
  const twoFactor: any = {
    issue: jest.fn(issueImpl || (async () => 'chal-1')),
    verify: jest.fn(async (_id: string, code: string) => {
      if (code !== '123456') throw new UnauthorizedException();
      return user?.id;
    }),
  };
  const telegram: any = { sendMessage: jest.fn(async () => true) };
  const svc = new AuthService(prisma, {} as any, twoFactor, telegram);
  return { svc, users, twoFactor, telegram };
}

const linked = { id: 'u1', phone: '+998900000001', isActive: true, telegramChatId: BigInt(7), passwordHash: 'x' };

describe('Parolni Telegram orqali tiklash', () => {
  it('ulangan xodimga kod yuboriladi va challengeId qaytadi', async () => {
    const { svc, twoFactor } = make(linked);
    const r = await svc.forgotPassword(linked.phone);
    expect(twoFactor.issue).toHaveBeenCalledWith('u1', BigInt(7), 'reset');
    expect(r.challengeId).toBe('chal-1');
  });

  it('noma\'lum yoki ulanmagan raqamga kod yuborilmaydi, lekin javob shaklida farq yo\'q', async () => {
    const a = make(null);
    const ra = await a.svc.forgotPassword('+998911111111');
    const b = make({ ...linked, telegramChatId: null });
    const rb = await b.svc.forgotPassword(linked.phone);
    expect(a.twoFactor.issue).not.toHaveBeenCalled();
    expect(b.twoFactor.issue).not.toHaveBeenCalled();
    expect(Object.keys(ra).sort()).toEqual(Object.keys(rb).sort());
    expect(ra.message).toBe(rb.message);
    expect(typeof ra.challengeId).toBe('string');
  });

  it('yuborish xato bersa ham tashqariga farq bildirilmaydi', async () => {
    const { svc } = make(linked, async () => { throw new Error('tg down'); });
    const r = await svc.forgotPassword(linked.phone);
    expect(typeof r.challengeId).toBe('string');
  });

  it('to\'g\'ri kod bilan parol yangilanadi', async () => {
    const { svc, users } = make(linked);
    await svc.resetPassword('chal-1', '123456', 'yangiParol1');
    expect(await bcrypt.compare('yangiParol1', users[0].passwordHash)).toBe(true);
  });

  it('parol o\'zgargach egasiga Telegramda ogohlantirish yuboriladi', async () => {
    const { svc, telegram } = make(linked);
    await svc.resetPassword('chal-1', '123456', 'yangiParol1');
    expect(telegram.sendMessage).toHaveBeenCalledTimes(1);
    expect(telegram.sendMessage.mock.calls[0][0]).toBe(BigInt(7));
    expect(String(telegram.sendMessage.mock.calls[0][1])).toContain('parolingiz o\'zgartirildi');
  });

  it('ogohlantirish yuborilmasa ham parol yangilanadi', async () => {
    const { svc, users, telegram } = make(linked);
    telegram.sendMessage.mockRejectedValueOnce(new Error('tg down'));
    await svc.resetPassword('chal-1', '123456', 'yangiParol1');
    expect(await bcrypt.compare('yangiParol1', users[0].passwordHash)).toBe(true);
  });

  it('noto\'g\'ri kod bilan parol o\'zgarmaydi', async () => {
    const { svc, users } = make(linked);
    await expect(svc.resetPassword('chal-1', '000000', 'yangiParol1')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users[0].passwordHash).toBe('x');
  });
});
