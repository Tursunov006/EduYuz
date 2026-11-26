import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Cloudflare Turnstile ("Men robot emasman") tekshiruvi.
// TURNSTILE_SECRET_KEY o'rnatilmagan bo'lsa tekshiruv o'chiq turadi (login avvalgidek ishlaydi).
// Kalit o'rnatilgan bo'lsa: token bo'lmasa yoki Cloudflare tasdiqlamasa — kirish rad etiladi.
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return !!this.config.get<string>('TURNSTILE_SECRET_KEY');
  }

  async verify(token: string | undefined, ip?: string): Promise<void> {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) return;
    if (!token) throw new UnauthorizedException('Iltimos, "Men robot emasman" tekshiruvidan o\'ting');

    try {
      const body = new URLSearchParams({ secret, response: token });
      if (ip) body.set('remoteip', ip);
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(8000),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!data.success) throw new UnauthorizedException('Robot tekshiruvi o\'tmadi, qayta urinib ko\'ring');
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`Turnstile tekshiruvi ishlamadi: ${(err as Error).message}`);
      throw new UnauthorizedException('Robot tekshiruvini bajarib bo\'lmadi, birozdan so\'ng qayta urinib ko\'ring');
    }
  }
}
