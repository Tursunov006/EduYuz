import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';
import { parseStaffLinkToken } from '../auth/staff-link.util';

// Xodimlar uchun ALOHIDA Telegram bot: 2 bosqichli kirish kodlari, parolni tiklash kodlari va
// parol o'zgargani haqida ogohlantirish shu bot orqali boradi. Ota-onalar boti (TelegramService) bilan aralashmaydi.
// STAFF_BOT_TOKEN berilmasa hammasi avvalgidek asosiy bot orqali ishlayveradi.
@Injectable()
export class StaffBotService implements OnModuleInit {
  private readonly logger = new Logger(StaffBotService.name);
  private usernameCache: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly main: TelegramService,
  ) {}

  private get token(): string | null {
    const t = this.config.get<string>('STAFF_BOT_TOKEN')?.trim();
    return t && !t.includes('YOUR_') ? t : null;
  }

  isConfigured(): boolean {
    return !!this.token;
  }

  async onModuleInit() {
    if (!this.token) return;
    // Vercel preview nusxalari botni asosiy serverdan tortib olmasligi uchun faqat production'da ulanadi
    if (process.env.VERCEL && process.env.VERCEL_ENV !== 'production') return;
    this.registerWebhook().catch((e) => this.logger.warn(`Xodimlar boti webhook'ini o'rnatib bo'lmadi: ${e?.message}`));
  }

  private webhookUrl(): string | null {
    const explicit = this.config.get<string>('STAFF_BOT_WEBHOOK_URL')?.trim();
    if (explicit) return explicit;
    const render = this.config.get<string>('RENDER_EXTERNAL_URL')?.trim();
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const base = render || (vercel ? `https://${vercel}` : '');
    return base ? `${base.replace(/\/+$/, '')}/api/v1/telegram/staff-webhook` : null;
  }

  private secret(): string {
    return createHash('sha256').update(`eduyuz-staff-webhook:${this.token}`).digest('hex').slice(0, 48);
  }

  isValidWebhookSecret(header?: string): boolean {
    if (!this.token || !header) return false;
    const a = Buffer.from(header);
    const b = Buffer.from(this.secret());
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private async api(method: string, body?: unknown): Promise<any> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    return res.json();
  }

  private async registerWebhook() {
    const url = this.webhookUrl();
    if (!url) {
      this.logger.warn("Xodimlar boti: webhook manzili aniqlanmadi (STAFF_BOT_WEBHOOK_URL bering). Bot xabar qabul qilmaydi.");
      return;
    }
    try {
      const info = await this.api('getWebhookInfo');
      if (info?.result?.url === url) return;
    } catch {
      /* tekshirib bo'lmasa qayta o'rnatiladi */
    }
    const data = await this.api('setWebhook', { url, secret_token: this.secret(), drop_pending_updates: false });
    if (data?.ok) this.logger.log(`Xodimlar boti webhook'i o'rnatildi: ${url}`);
    else this.logger.warn(`Xodimlar boti webhook'i o'rnatilmadi: ${data?.description}`);
  }

  // Xodimga xabar: alohida bot sozlangan bo'lsa o'sha orqali, bo'lmasa asosiy bot orqali
  async sendMessage(chatId: string | number | bigint, text: string): Promise<boolean> {
    if (!this.token) return this.main.sendMessage(chatId, text);
    try {
      const data = await this.api('sendMessage', {
        chat_id: chatId.toString(),
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      if (!data?.ok) {
        this.logger.error(`Xodimlar botidan xabar yuborib bo'lmadi: ${data?.description}`);
        return false;
      }
      return true;
    } catch (e: any) {
      this.logger.error(`Xodimlar botidan xabar yuborishda xato: ${e?.message}`);
      return false;
    }
  }

  // Ulanish havolasi/QR uchun botning @nomi
  async getBotUsername(): Promise<string | null> {
    if (!this.token) return this.main.getBotUsername();
    const fixed = this.config.get<string>('STAFF_BOT_USERNAME')?.trim().replace(/^@/, '');
    if (fixed) return fixed;
    if (this.usernameCache) return this.usernameCache;
    try {
      const data = await this.api('getMe');
      const name = data?.ok ? data.result?.username : undefined;
      if (name) this.usernameCache = name;
      return name || null;
    } catch (e: any) {
      this.logger.warn(`Xodimlar botining nomini olib bo'lmadi: ${e?.message}`);
      return null;
    }
  }

  // Webhook orqali kelgan xabar: faqat /start staff_<token> (xodimni ulash)
  async handleWebhookUpdate(update: any): Promise<void> {
    try {
      const msg = update?.message;
      const chatId = msg?.chat?.id;
      if (!msg || msg.chat?.type !== 'private' || chatId == null) return;
      const text = String(msg.text || '').trim();

      if (text.startsWith('/start staff_')) {
        const staffId = parseStaffLinkToken(text.replace('/start staff_', ''));
        if (!staffId) {
          await this.sendMessage(chatId, `⚠️ Havola eskirgan yoki noto'g'ri. EduYuzda «Xavfsizlik» bo'limidan yangi havola oling.`);
          return;
        }
        const upd = await this.prisma.user.updateMany({
          where: { id: staffId, isActive: true },
          data: { telegramChatId: BigInt(chatId) },
        });
        await this.sendMessage(
          chatId,
          upd.count > 0
            ? `✅ <b>Xodim hisobingiz Telegramga ulandi.</b>\nEndi EduYuzda «Xavfsizlik» bo'limida 2 bosqichli kirishni yoqishingiz va parolni shu bot orqali tiklashingiz mumkin.`
            : `⚠️ Xodim topilmadi.`,
        );
        return;
      }

      await this.sendMessage(
        chatId,
        `👋 Bu <b>EduYuz xodimlar boti</b>. U kirish kodlarini va parol tiklash kodlarini yuboradi.\n\nUlanish uchun EduYuzda «Xavfsizlik» bo'limidagi QR kodni skaner qiling yoki havolani oching.`,
      );
    } catch (e: any) {
      this.logger.warn(`Xodimlar botida xato: ${e?.message || e}`);
    }
  }
}
