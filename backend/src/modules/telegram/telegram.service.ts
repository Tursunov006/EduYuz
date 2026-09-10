import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string | null = null;
  private isPolling = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || null;
    if (!this.botToken || this.botToken.includes('YOUR_TELEGRAM_BOT_TOKEN')) {
      this.logger.warn(
        '⚠️ TELEGRAM_BOT_TOKEN sozlanmagan. Telegram xabarlar simulyatsiya (console) rejimida ishlaydi.',
      );
    } else {
      this.logger.log('🤖 Telegram Bot muvaffaqiyatli ulandi!');
      this.startPolling();
    }
  }

  // Xabar yuborish bazaviy metodi
  async sendMessage(
    chatId: string | number | bigint,
    text: string,
    replyMarkup?: any,
  ): Promise<boolean> {
    const targetChatId = chatId.toString();
    if (!this.botToken || this.botToken.includes('YOUR_TELEGRAM_BOT_TOKEN')) {
      this.logger.log(`[Telegram Simulyatsiya] ChatId: ${targetChatId} -> Xabar:\n${text}`);
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: text,
          parse_mode: 'HTML',
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        this.logger.error(`Telegramga xabar yuborishda xatolik: ${data.description}`);
        return false;
      }
      return true;
    } catch (err: any) {
      this.logger.error(`Telegram API xatoligi: ${err.message}`);
      return false;
    }
  }

  // 1. Davomat bildirishnomasi
  async sendAttendanceAlert(
    parentChatId: bigint | string | null | undefined,
    studentName: string,
    groupName: string,
    status: string,
    date: string,
  ) {
    if (!parentChatId) return;

    let statusText = '';
    if (status === 'absent' || status === 'ABSENT') {
      statusText = '❌ <b>Darsga qatnashmadi (Kelmadi)</b>';
    } else if (status === 'late' || status === 'LATE') {
      statusText = '⏳ <b>Darsga kechikib keldi</b>';
    } else {
      return; // "Keldi" bo'lsa ota-onani bezovta qilmaslik mumkin (yoki xohishga ko'ra yuborish)
    }

    const message = `
📢 <b>EduYuz — Davomat Bildirishnomasi</b>

Hurmatli ota-ona!
Farzandingiz <b>${studentName}</b> bugun quyidagi dars bo'yicha yo'qlama qilindi:

📚 <b>Guruh:</b> ${groupName}
📅 <b>Sana:</b> ${date}
📊 <b>Holati:</b> ${statusText}

<i>O'quv markazi ma'muriyati</i>
    `.trim();

    await this.sendMessage(parentChatId, message);
  }

  // 2. To'lov qabul qilinganda elektron chek
  async sendPaymentReceipt(
    parentChatId: bigint | string | null | undefined,
    studentName: string,
    amount: number,
    method: string,
    newBalance: number,
    comment?: string | null,
  ) {
    if (!parentChatId) return;

    const message = `
🧾 <b>EduYuz — To'lov Qabul Qilindi!</b>

Hurmatli ota-ona!
Farzandingiz <b>${studentName}</b> uchun to'lov muvaffaqiyatli qabul qilindi.

💵 <b>To'lov miqdori:</b> ${amount.toLocaleString()} so'm
💳 <b>To'lov usuli:</b> ${method.toUpperCase()}
📊 <b>Joriy hisob balansi:</b> ${newBalance.toLocaleString()} so'm
${comment ? `📝 <b>Izoh:</b> ${comment}\n` : ''}
📅 <b>Vaqt:</b> ${new Date().toLocaleString()}

<i>O'quv markazimizni tanlaganingiz uchun tashakkur!</i>
    `.trim();

    await this.sendMessage(parentChatId, message);
  }

  // 3. Qarzdorlik eslatmasi
  async sendDebtAlert(
    parentChatId: bigint | string | null | undefined,
    studentName: string,
    debtAmount: number,
    groupName: string,
  ) {
    if (!parentChatId) return;

    const message = `
⚠️ <b>EduYuz — To'lov Eslatmasi</b>

Hurmatli ota-ona!
Farzandingiz <b>${studentName}</b> (${groupName}) bo'yicha to'lov muddati yetib keldi.

📌 <b>Qarzdorlik miqdori:</b> ${Math.abs(debtAmount).toLocaleString()} so'm

Iltimos, o'quv markazi kassasiga yoki Click/Payme orqali to'lovni amalga oshirishingizni so'raymiz.

<i>EduYuz Ta'lim Markazi</i>
    `.trim();

    await this.sendMessage(parentChatId, message);
  }

  // Telegram botda ota-onani /start orqali avtomatik aniqlash (Polling)
  private async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    let offset = 0;

    const poll = async () => {
      try {
        if (!this.botToken) return;
        const res = await fetch(
          `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=20`,
        );
        const data = await res.json();

        if (data.ok && data.result?.length > 0) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            await this.handleUpdate(update);
          }
        }
      } catch (err) {
        // Tarmoq xatoliklarida polling davom etaveradi
      } finally {
        setTimeout(poll, 1500);
      }
    };

    poll();
  }

  private async handleUpdate(update: any) {
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = msg.text || '';

    const webAppUrl = this.configService.get<string>('TELEGRAM_WEBAPP_URL') || '';

    // Masalan: /start student_UUID yoki telefon raqami
    if (text.startsWith('/start student_')) {
      const studentId = text.replace('/start student_', '').trim();
      const student = await this.prisma.student.findUnique({ where: { id: studentId } });

      if (student) {
        await this.prisma.student.update({
          where: { id: studentId },
          data: { parentChatId: BigInt(chatId) },
        });

        const replyMarkup = webAppUrl.startsWith('https://')
          ? {
              inline_keyboard: [
                [
                  {
                    text: '📱 EduYuz Mini Ilovasi (Ochish)',
                    web_app: { url: `${webAppUrl}/app?studentId=${student.id}` },
                  },
                ],
              ],
            }
          : undefined;

        await this.sendMessage(
          chatId,
          `✅ <b>Assalomu alaykum!</b>\nSiz muvaffaqiyatli tarzda <b>${student.fullName}</b> o'quvchisining ota-onasi sifatida ro'yxatdan o'tdingiz.\n\nEndi farzandingizning davomati, baholari va to'lovlari haqidagi barcha xabarnomalar to'g'ridan-to'g'ri shu yerga yuboriladi.`,
          replyMarkup,
        );
        return;
      }
    }

    if (text === '/start') {
      const replyMarkup = webAppUrl.startsWith('https://')
        ? {
            inline_keyboard: [
              [
                {
                  text: '📱 EduYuz Mini Ilovani Ochish',
                  web_app: { url: `${webAppUrl}/app` },
                },
              ],
            ],
          }
        : undefined;

      await this.sendMessage(
        chatId,
        `👋 <b>Assalomu alaykum!</b>\nBu <b>EduYuz</b> ta'lim platformasining rasmiy xabardor qilish boti.\n\nFarzandingizning darsga kelgan/kelmaganligi va to'lov hisobotlarini qabul qilish uchun o'quv markazidan taqdim etilgan havoladan kiring yoki ma'muriyatga murojaat qiling.`,
        replyMarkup,
      );
    }
  }
}
