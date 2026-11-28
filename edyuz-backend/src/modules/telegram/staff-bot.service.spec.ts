import { StaffBotService } from './staff-bot.service';
import { makeStaffLinkToken } from '../auth/staff-link.util';

function make(env: Record<string, string | undefined>) {
  const main: any = { sendMessage: jest.fn(async () => true), getBotUsername: jest.fn(async () => 'main_bot') };
  const prisma: any = { user: { updateMany: jest.fn(async () => ({ count: 1 })) } };
  const svc = new StaffBotService({ get: (k: string) => env[k] } as any, prisma, main);
  return { svc, main, prisma };
}

describe('StaffBotService', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('STAFF_BOT_TOKEN bo\'lmasa asosiy bot orqali ishlaydi', async () => {
    const { svc, main } = make({});
    expect(svc.isConfigured()).toBe(false);
    await svc.sendMessage(5, 'salom');
    expect(main.sendMessage).toHaveBeenCalledWith(5, 'salom');
    await expect(svc.getBotUsername()).resolves.toBe('main_bot');
  });

  it('alohida bot sozlangan bo\'lsa xabar o\'sha bot tokeni bilan ketadi, asosiy bot ishlatilmaydi', async () => {
    const f = jest.fn().mockResolvedValue({ json: async () => ({ ok: true }) });
    global.fetch = f as any;
    const { svc, main } = make({ STAFF_BOT_TOKEN: '999:staff' });
    expect(await svc.sendMessage(7, 'kod')).toBe(true);
    expect(String(f.mock.calls[0][0])).toContain('/bot999:staff/sendMessage');
    expect(main.sendMessage).not.toHaveBeenCalled();
  });

  it('Telegram rad etsa false qaytaradi', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ok: false, description: 'Forbidden' }) }) as any;
    expect(await make({ STAFF_BOT_TOKEN: '999:staff' }).svc.sendMessage(7, 'x')).toBe(false);
  });

  it('bot nomi STAFF_BOT_USERNAME dan olinadi', async () => {
    await expect(make({ STAFF_BOT_TOKEN: '999:staff', STAFF_BOT_USERNAME: '@xodim_bot' }).svc.getBotUsername()).resolves.toBe('xodim_bot');
  });

  it('webhook maxfiy kaliti faqat to\'g\'ri qiymat bilan o\'tadi', () => {
    const { svc } = make({ STAFF_BOT_TOKEN: '999:staff' });
    const good = (svc as any).secret();
    expect(svc.isValidWebhookSecret(good)).toBe(true);
    expect(svc.isValidWebhookSecret('boshqa')).toBe(false);
    expect(svc.isValidWebhookSecret(undefined)).toBe(false);
    expect(make({}).svc.isValidWebhookSecret(good)).toBe(false);
  });

  it('/start staff_<token> xodimni ulaydi', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ok: true }) }) as any;
    const { svc, prisma } = make({ STAFF_BOT_TOKEN: '999:staff' });
    const token = makeStaffLinkToken('11111111-1111-1111-1111-111111111111');
    await svc.handleWebhookUpdate({ message: { chat: { id: 42, type: 'private' }, text: `/start staff_${token}` } });
    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { telegramChatId: BigInt(42) } }),
    );
  });

  it('eskirgan havola xodimni ulamaydi', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ok: true }) }) as any;
    const { svc, prisma } = make({ STAFF_BOT_TOKEN: '999:staff' });
    await svc.handleWebhookUpdate({ message: { chat: { id: 42, type: 'private' }, text: '/start staff_buzuq' } });
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
