import * as bcrypt from 'bcrypt';
import { SuperadminBootstrapService } from './superadmin-bootstrap.service';

// Superadmin parolini SUPERADMIN_PASSWORD orqali o'rnatish
describe('SuperadminBootstrapService', () => {
  const make = (user: any) => ({
    user: { findUnique: jest.fn().mockResolvedValue(user), update: jest.fn(), create: jest.fn() },
    center: { findFirst: jest.fn().mockResolvedValue({ id: 'c1' }) },
  });
  afterEach(() => { delete process.env.SUPERADMIN_PASSWORD; delete process.env.SUPERADMIN_PHONE; });

  it("o'zgaruvchi berilmasa hech narsa qilmaydi", async () => {
    const p = make(null);
    await new SuperadminBootstrapService(p as any).ensureSuperadmin();
    expect(p.user.findUnique).not.toHaveBeenCalled();
  });

  it('parol boshqacha bo\'lsa yangilaydi (yangi parol bilan mos keladi)', async () => {
    process.env.SUPERADMIN_PASSWORD = 'YangiParol123';
    const p = make({ id: 'u1', passwordHash: await bcrypt.hash('eski-parol', 4), role: 'superadmin', isActive: true });
    await new SuperadminBootstrapService(p as any).ensureSuperadmin();
    const data = p.user.update.mock.calls[0][0].data;
    expect(await bcrypt.compare('YangiParol123', data.passwordHash)).toBe(true);
    expect(data).toMatchObject({ role: 'superadmin', isActive: true });
  });

  it('parol allaqachon to\'g\'ri bo\'lsa tegmaydi', async () => {
    process.env.SUPERADMIN_PASSWORD = 'YangiParol123';
    const p = make({ id: 'u1', passwordHash: await bcrypt.hash('YangiParol123', 4), role: 'superadmin', isActive: true });
    await new SuperadminBootstrapService(p as any).ensureSuperadmin();
    expect(p.user.update).not.toHaveBeenCalled();
  });

  it("hisob yo'q bo'lsa birinchi markazga superadmin yaratadi", async () => {
    process.env.SUPERADMIN_PASSWORD = 'YangiParol123';
    process.env.SUPERADMIN_PHONE = '+998900000000';
    const p = make(null);
    await new SuperadminBootstrapService(p as any).ensureSuperadmin();
    expect(p.user.create.mock.calls[0][0].data).toMatchObject({ phone: '+998900000000', role: 'superadmin', centerId: 'c1' });
  });
});
