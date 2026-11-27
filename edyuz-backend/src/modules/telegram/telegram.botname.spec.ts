import { TelegramService } from './telegram.service';

function make(env: Record<string, string | undefined>) {
  const config = { get: (k: string) => env[k] } as any;
  return new TelegramService(config, {} as any, {} as any);
}

describe('TelegramService.getBotUsername', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('TELEGRAM_BOT_USERNAME berilgan bo\'lsa o\'shani qaytaradi (@ siz)', async () => {
    const svc = make({ TELEGRAM_BOT_USERNAME: '@my_bot' });
    await expect(svc.getBotUsername()).resolves.toBe('my_bot');
  });

  it('token yo\'q bo\'lsa null', async () => {
    await expect(make({}).getBotUsername()).resolves.toBeNull();
  });

  it('getMe javobidan nomni oladi va eslab qoladi', async () => {
    const f = jest.fn().mockResolvedValue({ json: async () => ({ ok: true, result: { username: 'real_bot' } }) });
    global.fetch = f as any;
    const svc = make({ TELEGRAM_BOT_TOKEN: '123:abc' });
    await expect(svc.getBotUsername()).resolves.toBe('real_bot');
    await expect(svc.getBotUsername()).resolves.toBe('real_bot');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('Telegram ishlamasa null qaytaradi', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('net')) as any;
    await expect(make({ TELEGRAM_BOT_TOKEN: '123:abc' }).getBotUsername()).resolves.toBeNull();
  });
});
