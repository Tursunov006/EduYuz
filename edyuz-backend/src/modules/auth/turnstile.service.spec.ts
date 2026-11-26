import { UnauthorizedException } from '@nestjs/common';
import { TurnstileService } from './turnstile.service';

function make(secret?: string) {
  return new TurnstileService({ get: () => secret } as any);
}

describe('TurnstileService', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('kalit yo\'q bo\'lsa tekshiruv o\'chiq', async () => {
    await expect(make(undefined).verify(undefined)).resolves.toBeUndefined();
  });

  it('kalit bor, token yo\'q — rad etadi', async () => {
    await expect(make('s').verify(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Cloudflare tasdiqlasa o\'tkazadi', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: true }) }) as any;
    await expect(make('s').verify('tok', '1.2.3.4')).resolves.toBeUndefined();
  });

  it('Cloudflare rad etsa yoki ishlamasa — rad etadi', async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: false }) }) as any;
    await expect(make('s').verify('tok')).rejects.toBeInstanceOf(UnauthorizedException);
    global.fetch = jest.fn().mockRejectedValue(new Error('net')) as any;
    await expect(make('s').verify('tok')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
