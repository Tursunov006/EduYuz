import { SmsService } from './sms.service';

// Haqiqiy SMS: kalit bo'lmasa "yuborildi" deb yolg'on aytilmasligi va Eskiz javobi tekshirilishi kerak
describe('SmsService', () => {
  const make = (env: Record<string, string>) => {
    const prisma: any = { smsLog: { create: jest.fn().mockResolvedValue({}) } };
    const config: any = { get: (k: string) => env[k] };
    return { svc: new SmsService(config, prisma), prisma };
  };
  const res = (status: number, body: any) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as any;
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; jest.restoreAllMocks(); });

  it("kalit bo'lmasa 'not_configured' qaytaradi, hech narsa yubormaydi va jurnalga yozmaydi", async () => {
    const { svc, prisma } = make({});
    global.fetch = jest.fn() as any;
    const r = await svc.sendSms('+998901234567', 'salom');
    expect(r).toMatchObject({ success: false, status: 'not_configured' });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(prisma.smsLog.create).not.toHaveBeenCalled();
  });

  it("Eskiz muvaffaqiyatli javob bersa 'sent' va raqam 998 bilan yuboriladi", async () => {
    const { svc, prisma } = make({ ESKIZ_EMAIL: 'a@b.uz', ESKIZ_PASSWORD: 'x' });
    const f = jest.fn()
      .mockResolvedValueOnce(res(200, { data: { token: 'T' } }))
      .mockResolvedValueOnce(res(200, { status: 'waiting', id: '1' }));
    global.fetch = f as any;
    const r = await svc.sendSms('90 123 45 67', 'salom');
    expect(r).toEqual({ success: true, status: 'sent' });
    expect(String(f.mock.calls[1][1].body)).toContain('mobile_phone=998901234567');
    expect(prisma.smsLog.create).toHaveBeenCalledWith({ data: { phone: '998901234567', message: 'salom', status: 'sent' } });
  });

  it("Eskiz xato qaytarsa 'failed' va sabab ko'rsatiladi", async () => {
    const { svc } = make({ ESKIZ_EMAIL: 'a@b.uz', ESKIZ_PASSWORD: 'x' });
    global.fetch = jest.fn()
      .mockResolvedValueOnce(res(200, { data: { token: 'T' } }))
      .mockResolvedValueOnce(res(400, { status: 'error', message: 'Matn tasdiqlanmagan' })) as any;
    const r = await svc.sendSms('+998901234567', 'salom');
    expect(r).toMatchObject({ success: false, status: 'failed', error: 'Matn tasdiqlanmagan' });
  });

  it("token eskirgan (401) bo'lsa qayta kirib, bir marta qayta urinadi", async () => {
    const { svc } = make({ ESKIZ_EMAIL: 'a@b.uz', ESKIZ_PASSWORD: 'x' });
    const f = jest.fn()
      .mockResolvedValueOnce(res(200, { data: { token: 'OLD' } }))
      .mockResolvedValueOnce(res(401, {}))
      .mockResolvedValueOnce(res(200, { data: { token: 'NEW' } }))
      .mockResolvedValueOnce(res(200, { status: 'waiting' }));
    global.fetch = f as any;
    const r = await svc.sendSms('+998901234567', 'salom');
    expect(r.success).toBe(true);
    expect(f.mock.calls[3][1].headers.Authorization).toBe('Bearer NEW');
  });
});
