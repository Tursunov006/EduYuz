import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string | null = null;
  private botUsernameCache: string | null = null;
  private isPolling = false;
  // Foydalanuvchi holatini eslab qolish (masalan: direktorga murojaat yozayotganda)
  private userState = new Map<string, 'awaiting_feedback' | 'awaiting_lead_phone'>();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // Botning @nomi: TELEGRAM_BOT_USERNAME berilgan bo'lsa o'sha, bo'lmasa Telegramning getMe javobidan.
  // O'quvchini botga ulash havolasi/QR kodi shu nom bilan yasaladi.
  async getBotUsername(): Promise<string | null> {
    const fixed = this.configService.get<string>('TELEGRAM_BOT_USERNAME')?.trim().replace(/^@/, '');
    if (fixed) return fixed;
    if (this.botUsernameCache) return this.botUsernameCache;
    const token = this.botToken || this.configService.get<string>('TELEGRAM_BOT_TOKEN')?.trim() || null;
    if (!token || token.includes('YOUR_TELEGRAM_BOT_TOKEN')) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as { ok?: boolean; result?: { username?: string } };
      const name = data?.ok ? data.result?.username : undefined;
      if (name) this.botUsernameCache = name;
      return name || null;
    } catch (e) {
      this.logger.warn(`Bot nomini olib bo'lmadi: ${(e as Error)?.message}`);
      return null;
    }
  }

  async onModuleInit() {
    // Token faqat muhit o'zgaruvchisidan olinadi. Avval kodda zaxira sifatida HAQIQIY
    // bot tokeni ochiq yozilgan edi — u GitHub tarixida qolgan, shuning uchun
    // @BotFather orqali /revoke qilib, yangi tokenni .env ga yozish SHART.
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')?.trim() || null;
    if (!this.botToken || this.botToken.includes('YOUR_TELEGRAM_BOT_TOKEN')) {
      this.logger.warn(
        '⚠️ TELEGRAM_BOT_TOKEN sozlanmagan. Telegram xabarlar simulyatsiya (console) rejimida ishlaydi.',
      );
    } else if (process.env.VERCEL && process.env.VERCEL_ENV !== 'production') {
      // Vercel preview (sinov) nusxalari botni asosiy serverdan tortib olmasligi kerak
      this.logger.log('Vercel preview muhiti: Telegram bot ulanmaydi (faqat xabar yuborish ishlaydi).');
    } else if (process.env.VERCEL) {
      // Vercel'da server har "uyg'onganda" birinchi so'rov shu tekshiruvni kutmasligi uchun fonda bajariladi
      // (webhook allaqachon o'rnatilgan bo'ladi, bu faqat tekshiruv).
      this.connect().catch((e) => this.logger.warn(`Telegram ulanishini tekshirishda xato: ${e?.message}`));
    } else {
      await this.connect();
      this.logger.log('🤖 EduYuz 2.0 Super Telegram Bot muvaffaqiyatli ulandi!');
    }
  }

  // Webhook manzili. Render bepul tarifida server 15 daqiqa so'rov kelmasa uxlab qoladi:
  // polling (getUpdates) ham to'xtaydi va bot javob bermay qoladi. Webhook'da esa Telegram
  // xabarni serverga o'zi yuboradi va uxlab qolgan serverni uyg'otadi.
  // TELEGRAM_WEBHOOK_URL berilmasa, Render beradigan RENDER_EXTERNAL_URL ishlatiladi.
  private webhookUrl(): string | null {
    const explicit = this.configService.get<string>('TELEGRAM_WEBHOOK_URL')?.trim();
    if (explicit) return explicit;
    const render = this.configService.get<string>('RENDER_EXTERNAL_URL')?.trim();
    // Vercel: loyihaning asosiy (production) domeni, masalan "eduyuz-api.vercel.app"
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const base = render || (vercel ? `https://${vercel}` : '');
    return base ? `${base.replace(/\/+$/, '')}/api/v1/telegram/webhook` : null;
  }

  // Telegram webhook so'rovlarini tekshirish uchun maxfiy kalit (bot tokenidan hosil qilinadi)
  private webhookSecret(): string {
    return createHash('sha256').update(`eduyuz-webhook:${this.botToken}`).digest('hex').slice(0, 48);
  }

  isValidWebhookSecret(header?: string): boolean {
    if (!this.botToken || !header) return false;
    const a = Buffer.from(header);
    const b = Buffer.from(this.webhookSecret());
    return a.length === b.length && timingSafeEqual(a, b);
  }

  // Webhook orqali kelgan yangilanishni qayta ishlaydi. Javob (200) qayta ishlash tugagach yuboriladi:
  // Google Cloud Run kabi serverlarda javob qaytgandan keyin protsessor to'xtatiladi, shuning uchun
  // bot javobi javobdan oldin yuborilishi kerak. Xato bo'lsa ham reject qilinmaydi (Telegram qayta yubormasin).
  async handleWebhookUpdate(update: any): Promise<void> {
    try {
      await this.handleUpdate(update);
      this.logger.log(`Telegram yangilanishi qayta ishlandi (update_id=${update?.update_id})`);
    } catch (err: any) {
      this.logger.warn(`Telegram yangilanishini qayta ishlashda xato: ${err?.message || err}`);
    }
  }

  // Webhook mumkin bo'lsa webhook, aks holda polling
  private async connect() {
    const url = this.webhookUrl();
    // Vercel (serverless): har bir "sovuq" ishga tushishda webhook'ni qayta o'rnatmaslik uchun avval tekshiriladi.
    // Polling bu yerda ishlay olmaydi — server so'rovlar orasida to'xtatiladi.
    if (process.env.VERCEL) {
      if (!url) {
        this.logger.warn('Vercel: webhook manzili aniqlanmadi (TELEGRAM_WEBHOOK_URL bering). Bot xabar qabul qilmaydi.');
        return;
      }
      try {
        const info: any = await (await fetch(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`)).json();
        if (info?.result?.url === url) return;
      } catch {
        /* tekshirib bo'lmasa — qayta o'rnatiladi */
      }
    }
    await this.clearWebhookAndSetupMenu();
    if (url) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            secret_token: this.webhookSecret(),
            drop_pending_updates: false,
          }),
        });
        const data: any = await res.json();
        if (data?.ok) {
          this.logger.log(`Telegram webhook o'rnatildi: ${url}`);
          return;
        }
        this.logger.warn(`Webhook o'rnatilmadi (${data?.description}). Polling ishlatiladi.`);
      } catch (e: any) {
        this.logger.warn(`Webhook o'rnatishda xato: ${e.message}. Polling ishlatiladi.`);
      }
    }
    if (process.env.VERCEL) return;
    this.startPolling();
  }

  // Begona webhooklarni o'chirish va rasmiy menyu komandalarini o'rnatish
  async clearWebhookAndSetupMenu() {
    if (!this.botToken) return;
    try {
      await fetch(
        `https://api.telegram.org/bot${this.botToken}/deleteWebhook?drop_pending_updates=false`,
      );
      await fetch(`https://api.telegram.org/bot${this.botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: '🏠 Asosiy menyu va farzandni ulash' },
            { command: 'davomat', description: '📊 Farzandim davomati va statistika' },
            { command: 'jadval', description: '🗓 Dars jadvali va uyga vazifalar' },
            { command: 'tolov', description: '💰 To‘lovlar tarixi va balans' },
            { command: 'sertifikat', description: '🎓 QR-Sertifikatlar' },
            { command: 'kurslar', description: '🎁 Kurslar va sinov darsiga yozilish' },
            { command: 'app', description: '📱 EduYuz Mobil Mini Ilovasi' },
          ],
        }),
      });
    } catch (e: any) {
      this.logger.warn(`Webhook/Menu sozlashda xato: ${e.message}`);
    }
  }

  // Bot tokenni dinamik yangilash (agar @BotFather orqali /revoke qilinsa)
  async updateBotToken(newToken: string) {
    if (!newToken || !/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(newToken.trim())) {
      return { success: false, message: 'Token formati noto‘g‘ri' };
    }
    this.botToken = newToken.trim();
    await this.connect();
    return {
      success: true,
      message: 'Yangi Telegram Bot Token muvaffaqiyatli ulandi va himoyalandi!',
    };
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
          disable_web_page_preview: true,
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

  // Rasm yuborish bazaviy metodi (base64)
  async sendPhotoBase64(
    chatId: string | number | bigint,
    base64Data: string,
    caption?: string,
  ): Promise<boolean> {
    const targetChatId = chatId.toString();
    if (!this.botToken || this.botToken.includes('YOUR_TELEGRAM_BOT_TOKEN')) {
      this.logger.log(`[Telegram Simulyatsiya] ChatId: ${targetChatId} -> Rasm: ${caption || ''}`);
      return true;
    }
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendPhoto`;
      const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
      const formData = new FormData();
      formData.append('chat_id', targetChatId);
      formData.append('photo', new Blob([buffer]), 'photo.jpg');
      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
      }

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) {
        this.logger.error(`Telegram rasmi yuborishda xato: ${data.description}`);
        return false;
      }
      return true;
    } catch (err: any) {
      this.logger.error(`sendPhotoBase64 xatosi: ${err.message}`);
      return false;
    }
  }

  // 1. Davomat bildirishnomasi (Keldi, Kechikdi va Kelmadi holatlari uchun!)
  async sendAttendanceAlert(
    parentChatId: bigint | string | null | undefined,
    studentName: string,
    groupName: string,
    status: string,
    date: string,
    reason?: string,
  ) {
    if (!parentChatId) return;

    const normalized = status.toLowerCase();
    let statusText = '';
    let bonusLine = '';

    if (normalized === 'absent') {
      statusText = '❌ <b>Darsga qatnashmadi (Kelmadi)</b>';
      const safeReason = reason?.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      bonusLine = safeReason
        ? `\n📝 <b>O'qituvchi izohi:</b> ${safeReason}`
        : '\n⚠️ <i>Iltimos, dars qoldirish sababini ma’muriyatga ma’lum qiling.</i>';
    } else if (normalized === 'late') {
      statusText = '⏳ <b>Darsga kechikib keldi</b>';
    } else if (normalized === 'present') {
      statusText = '✅ <b>Darsga o‘z vaqtida yetib keldi!</b>';
    } else {
      return;
    }

    const message = `
📢 <b>Davomat bildirishnomasi</b>

Hurmatli ota-ona!
Farzandingiz <b>${studentName}</b> bugun quyidagi dars bo'yicha yo'qlama qilindi:

📚 <b>Guruh:</b> ${groupName}
📅 <b>Sana:</b> ${date}
📊 <b>Holati:</b> ${statusText}${bonusLine}

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
🧾 <b>To‘lov kvitansiyasi</b>

Hurmatli ota-ona!
Farzandingiz <b>${studentName}</b> uchun to'lov muvaffaqiyatli qabul qilindi.

💵 <b>To'lov miqdori:</b> +${amount.toLocaleString()} so'm
💳 <b>To'lov usuli:</b> ${method.toUpperCase()}
📊 <b>Joriy hisob balansi:</b> ${newBalance.toLocaleString()} so'm
${comment ? `📝 <b>Izoh:</b> ${comment}\n` : ''}📅 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}

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
  ): Promise<boolean> {
    if (!parentChatId) return false;

    const message = `
⚠️ <b>To'lov eslatmasi</b>

Hurmatli ota-ona!
Farzandingiz <b>${studentName}</b> (${groupName}) bo'yicha to'lov muddati yetib keldi.

📌 <b>Qarzdorlik miqdori:</b> ${Math.abs(debtAmount).toLocaleString()} so'm

Iltimos, o'quv markazi kassasiga yoki Click/Payme orqali to'lovni amalga oshirishingizni so'raymiz.
    `.trim();

    return this.sendMessage(parentChatId, message);
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

  // ChatId bo'yicha ulangan talabani olish yordamchi funksiyasi
  private async findLinkedStudent(chatId: number | string) {
    let student = await this.prisma.student.findFirst({
      where: { parentChatId: BigInt(chatId) },
      include: {
        center: { select: { id: true, name: true, phone: true } },
        certificates: { orderBy: { issuedAt: 'desc' } },
        payments: { orderBy: { paidAt: 'desc' }, take: 5 },
        groups: {
          include: {
            group: {
              include: {
                course: true,
                teacher: true,
                lessons: { orderBy: { createdAt: 'desc' }, take: 3 },
              },
            },
          },
        },
      },
    });

    return student;
  }

  private async handleUpdate(update: any) {
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const chatKey = String(chatId);
    const text = (msg.text || '').trim();
    const contact = msg.contact;
    const senderName =
      [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
      msg.from?.username ||
      'Telegram Foydalanuvchi';
    const webAppUrl =
      this.configService.get<string>('TELEGRAM_WEBAPP_URL') || 'https://eduyuz.uz';

    // Yangilangan 10-tugmali Super Menyu (Reply Keyboard)
    const quickReplyKeyboard = {
      keyboard: [
        [
          { text: '📲 Farzandimni Ulash (Telefon)', request_contact: true },
          { text: '📊 Farzandim Davomati' },
        ],
        [{ text: '🗓 Dars Jadvali & Vazifa' }, { text: '💰 To‘lov & Qarz' }],
        [{ text: '🎓 Sertifikatlar' }, { text: '👨‍🏫 Ustozi Haqida' }],
        [{ text: '🎁 Bepul Darsga Yozilish' }, { text: '📩 Direktorga Murojaat' }],
        [{ text: '🏫 Markaz Kurslari' }, { text: '📱 Mini Ilova (/app)' }],
      ],
      resize_keyboard: true,
    };

    // 1. Ota-ona yoki yangi lid telefon raqamini ulashganda (request_contact)
    if (contact && contact.phone_number) {
      // Faqat foydalanuvchining O'Z raqami qabul qilinadi. Telegramda istalgan kontaktni
      // (masalan, begona ota-onaning raqamini) ulashish mumkin — tekshiruvsiz bu begona
      // o'quvchining ma'lumotlarini ko'rish va uning xabarnomalarini egallab olishga yo'l ochardi.
      if (!contact.user_id || contact.user_id !== msg.from?.id) {
        await this.sendMessage(
          chatId,
          `⚠️ Iltimos, boshqa kontaktni emas, pastdagi <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasi orqali <b>o‘z raqamingizni</b> yuboring.`,
          quickReplyKeyboard,
        );
        return;
      }

      const cleanPhone = contact.phone_number.replace(/\D/g, '');
      const last9 = cleanPhone.slice(-9);

      // Raqam to'liq (kamida 9 xonali) bo'lishi shart: qisqa raqam "contains" qidiruvida
      // ko'plab begona o'quvchilarga mos kelib qolardi.
      const students = last9.length < 9 ? [] : await this.prisma.student.findMany({
        where: {
          OR: [{ phone: { endsWith: last9 } }, { parentPhone: { endsWith: last9 } }],
        },
        include: {
          groups: { include: { group: { include: { course: true, teacher: true } } } },
        },
      });

      if (students.length > 0) {
        // Barcha mos kelgan farzandlariga parentChatId ni ulaymiz
        for (const st of students) {
          await this.prisma.student.update({
            where: { id: st.id },
            data: { parentChatId: BigInt(chatId) },
          });
        }

        const namesList = students
          .map(
            (s) =>
              `• <b>${s.fullName}</b> (${s.groups?.[0]?.group?.name || 'Guruhga biriktirilgan'} | Balans: ${Number(s.balance).toLocaleString()} so‘m)`,
          )
          .join('\n');

        await this.sendMessage(
          chatId,
          `✅ <b>Tabriklaymiz! Telefon raqamingiz (+${cleanPhone}) tasdiqlandi!</b>\n\n👨‍👩‍👧 Sizga biriktirilgan o‘quvchi(lar):\n${namesList}\n\nEndi pastdagi tugmalar orqali farzandingizning kunlik davomati, dars jadvali, uyga vazifalari, to‘lovlari va sertifikatlarini 24/7 kuzatib borishingiz mumkin! 🚀`,
          quickReplyKeyboard,
        );
        return;
      } else {
        // Agar bazada bunday o'quvchi topilmasa -> Demak bu YANGI MIJOZ (LID)! Uni CRM Voronkaga saqlaymiz!
        try {
          let center = await this.prisma.center.findFirst();
          if (center) {
            const payload = JSON.stringify({
              name: senderName,
              course: 'Telegram Bot (Bepul Dars)',
              source: 'Telegram Bot (@EduYuz)',
              notes: `Telegram orqali raqam qoldirdi. ChatID: ${chatId}.`,
              createdAt: new Date().toISOString(),
            });
            await this.prisma.smsLog.create({
              data: {
                phone: `+${cleanPhone}`,
                message: payload,
                status: 'lead_new',
              },
            });
          }
        } catch (e) {}

        await this.sendMessage(
          chatId,
          `🎉 <b>Arizangiz qabul qilindi, ${senderName}!</b>\n\n📞 Telefon raqamingiz (<b>+${cleanPhone}</b>) o‘quv markazimizning <b>«Sinov darsi»</b> ro‘yxatiga qo‘shildi!\n\nTez orada menejerlarimiz siz bilan bog‘lanib, o‘zingizga qulay dars vaqtini belgilab berishadi!`,
          quickReplyKeyboard,
        );
        return;
      }
    }

    // 2. Agar foydalanuvchi "Direktorga Murojaat" yozish holatida bo'lsa
    if (this.userState.get(chatKey) === 'awaiting_feedback' && !text.startsWith('/')) {
      this.userState.delete(chatKey);
      const linkedStudent = await this.findLinkedStudent(chatId);

      try {
        const center = await this.prisma.center.findFirst();
        if (center) {
          const payload = JSON.stringify({
            name: linkedStudent ? `${senderName} (${linkedStudent.fullName} ota-onasi)` : senderName,
            course: 'Direktorga Murojaat (Bot)',
            source: 'Telegram Bot Feedback',
            notes: `Murojaat matni: "${text}"`,
            createdAt: new Date().toISOString(),
          });
          await this.prisma.smsLog.create({
            data: {
              phone: linkedStudent?.parentPhone || linkedStudent?.phone || `TG:${chatId}`,
              message: payload,
              status: 'lead_new',
            },
          });
        }
      } catch {}

      await this.sendMessage(
        chatId,
        `✅ <b>Murojaatingiz to‘g‘ridan-to‘g‘ri Markaz Rahbariyatiga yetkazildi!</b>\n\n📝 <i>"${text}"</i>\n\nE’tiboringiz va fikringiz uchun rahmat. Ma’muriyatimiz tez orada sizga javob qaytaradi! 🙏`,
        quickReplyKeyboard,
      );
      return;
    }

    // 3. /start student_UUID (O'quvchi ID orqali maxsus ulanish)
    if (text.startsWith('/start student_')) {
      const studentId = text.replace('/start student_', '').trim();
      const student = await this.prisma.student.findUnique({ where: { id: studentId } });

      if (student) {
        await this.prisma.student.update({
          where: { id: studentId },
          data: { parentChatId: BigInt(chatId) },
        });

        await this.sendMessage(
          chatId,
          `✅ <b>Assalomu alaykum!</b>\nSiz muvaffaqiyatli tarzda <b>${student.fullName}</b> o'quvchisining ota-onasi sifatida ro'yxatdan o'tdingiz.\n\nFarzandingizning davomati, dars jadvali, baholari va to'lovlari haqidagi barcha xabarlar shu yerga yetkaziladi.`,
          quickReplyKeyboard,
        );
        return;
      }
    }

    // 4. Standart /start komandasi
    if (text === '/start') {
      const linked = await this.findLinkedStudent(chatId);
      const linkedBanner = linked
        ? `\n\n👨‍🎓 <b>Bog‘langan farzandingiz:</b> ${linked.fullName}`
        : `\n\n👉 <b>Farzandingizni ulash uchun</b> pastdagi <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasini bosing!`;

      await this.sendMessage(
        chatId,
        `👋 <b>Assalomu alaykum, hurmatli ota-ona va o‘quvchilar!</b>\n\nBu o‘quv markazining rasmiy botidir.${linkedBanner}\n\nMen orqali:\n• 📊 <b>Kunlik Davomat</b> (keldi/kelmadi hisoboti)\n• 🗓 <b>Dars Jadvali va Uyga Vazifalar (LMS)</b>\n• 💰 <b>Oylik To‘lovlar, Balans va Kvitansiyalar</b>\n• 🎓 <b>QR-Sertifikatlar</b>\n• 🎁 <b>Sinov darsiga yozilish</b>\nxizmatlaridan foydalanishingiz mumkin!`,
        quickReplyKeyboard,
      );
      return;
    }

    // 5. Mini Ilova (/app)
    if (text.includes('Mini Ilova') || text === '/app') {
      // Portal endi o'quvchilar ro'yxatini login'siz bermaydi, shuning uchun havolaga
      // shu chatga ulangan farzandning ID si qo'shiladi.
      const linked = await this.findLinkedStudent(chatId);
      if (!linked) {
        await this.sendMessage(
          chatId,
          `📱 Mini ilovani ochish uchun avval <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasi orqali farzandingiz profilini ulang.`,
          quickReplyKeyboard,
        );
        return;
      }
      const studentQuery = `?studentId=${linked.id}`;
      const inlineButtons = webAppUrl.startsWith('https://')
        ? {
            inline_keyboard: [
              [
                {
                  text: '🚀 EduYuz Mini Ilovasini Ochish',
                  web_app: { url: `${webAppUrl}/app${studentQuery}` },
                },
              ],
              [
                {
                  text: '🌐 Ota-onalar va O‘quvchi Portali (/portal)',
                  url: `${webAppUrl}/portal${studentQuery}`,
                },
              ],
            ],
          }
        : {
            inline_keyboard: [
              [
                {
                  text: '🌐 EduYuz Portalini Ochish',
                  url: `${webAppUrl}/app${studentQuery}`,
                },
              ],
            ],
          };

      await this.sendMessage(
        chatId,
        `📱 <b>EduYuz Mobil Mini Ilovasi va Portali:</b>\n\nFarzandingiz video darslarni ko‘rishi, interaktiv o‘yinlar o‘ynashi, uyga vazifalarni topshirishi va AI Repetitor bilan suhbatlashishi uchun quyidagi tugmani bosing:`,
        inlineButtons,
      );
      return;
    }

    // 6. BEPUL DARSGA YOZILISH (Yangi o'quvchilar / Lidlar uchun)
    if (text.includes('Bepul Darsga Yozilish') || text === '/kurslar') {
      // Faqat ulangan o'quvchining markazi (yoki TELEGRAM_DEFAULT_CENTER_ID) kurslari — boshqa markazlarniki aralashmaydi
      const linked = await this.findLinkedStudent(chatId);
      const centerId = linked?.centerId || this.configService.get<string>('TELEGRAM_DEFAULT_CENTER_ID') || null;
      const courses = centerId ? await this.prisma.course.findMany({ where: { centerId }, take: 10 }) : [];
      const courseLines =
        courses.length > 0
          ? courses
              .map(
                (c, i) =>
                  `${i + 1}. 📚 <b>${c.title}</b> — ${Number(c.price).toLocaleString()} so‘m/oy`,
              )
              .join('\n')
          : `Kurslar haqida batafsil ma’lumot uchun telefon raqamingizni qoldiring — menejerlarimiz bog‘lanishadi.`;

      await this.sendMessage(
        chatId,
        `🎁 <b>KURSLAR VA SINOV DARSI</b>\n\n${courseLines}\n\n👇 <b>Sinov darsiga yozilish uchun</b> pastdagi <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasini bosing yoki telefon raqamingizni shu yerga yozib yuboring!`,
        quickReplyKeyboard,
      );
      return;
    }

    // 7. DIREKTORGA MUROJAAT / SHIKOYAT VA TAKLIFLAR
    if (text.includes('Direktorga Murojaat')) {
      this.userState.set(chatKey, 'awaiting_feedback');
      await this.sendMessage(
        chatId,
        `📩 <b>Markaz Direktoriga To‘g‘ridan-To‘g‘ri Murojaat:</b>\n\nDars sifati, ustozlar faoliyati bo‘yicha taklif, savol yoki e’tirozingizni shu yerga bitta xabar qilib yozib yuboring.\n\n<i>Xabaringiz darhol markaz rahbariyatiga yetkaziladi:</i>`,
        quickReplyKeyboard,
      );
      return;
    }

    // Faqat shu chatga ulangan o'quvchi ma'lumotlari ko'rsatiladi.
    // Avval ulanmagan foydalanuvchiga "demo" sifatida bazadagi birinchi HAQIQIY o'quvchining
    // balansi, to'lovlari va davomati ko'rsatilardi — bu shaxsiy ma'lumot sizib chiqishi edi.
    const student = await this.findLinkedStudent(chatId);
    const demoNotice = '';

    const isPersonalCommand =
      text.includes('Dars Jadvali') ||
      text === '/jadval' ||
      text.includes('Farzandim Davomati') ||
      text === '/davomat' ||
      text.includes('To‘lov & Qarz') ||
      text === '/tolov' ||
      text.includes('Sertifikatlar') ||
      text.includes('Reyting & Sertifikat') ||
      text === '/sertifikat' ||
      text === '/reyting';

    if (!student && isPersonalCommand) {
      await this.sendMessage(
        chatId,
        `🔒 Bu bo‘lim faqat farzandi ulangan ota-onalar uchun.

Iltimos, avval pastdagi <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasini bosib, markazga bergan telefon raqamingizni tasdiqlang.`,
        quickReplyKeyboard,
      );
      return;
    }

    // 8. DARS JADVALI VA UYGA VAZIFALAR (LMS)
    if (text.includes('Dars Jadvali') || text === '/jadval') {
      if (!student || !student.groups || student.groups.length === 0) {
        await this.sendMessage(
          chatId,
          `🗓 <b>Dars Jadvali:</b>\nHozircha o‘quvchi hech qaysi guruhga biriktirilmagan.${demoNotice}`,
          quickReplyKeyboard,
        );
        return;
      }

      const scheduleBlocks = student.groups
        .map((sg: any) => {
          const g = sg.group;
          const daysStr = Array.isArray(g.days) ? g.days.join(', ') : g.days || 'Dush-Chor-Jum';
          const lessons = g.lessons || [];
          const latestLesson = lessons[0];

          const hwText = latestLesson
            ? `\n📖 <b>Oxirgi mavzu:</b> ${latestLesson.title}\n📝 <b>Uyga vazifa:</b> ${
                latestLesson.homework || 'Mavzuni takrorlash va amaliy mashqlar'
              }`
            : `\n📝 <b>Uyga vazifa:</b> Joriy dars konspektini takrorlash`;

          return `📚 <b>Guruh:</b> ${g.name} (${g.course?.title || 'Kurs'})\n🗓 <b>Kunlari:</b> ${daysStr}\n🕒 <b>Dars vaqti:</b> ${g.startTime || '14:00'} — ${g.endTime || '16:00'}\n👨‍🏫 <b>Ustoz:</b> ${g.teacher?.fullName || 'Biriktirilgan ustoz'}${hwText}`;
        })
        .join('\n\n──────────────────\n\n');

      await this.sendMessage(
        chatId,
        `🗓 <b>${student.fullName} — Dars Jadvali va Uyga Vazifalar (LMS)</b>\n\n${scheduleBlocks}${demoNotice}`,
        quickReplyKeyboard,
      );
      return;
    }

    // 9. FARZANDIM DAVOMATI (Aniq foiz va oxirgi 7 dars bilan)
    if (text.includes('Farzandim Davomati') || text === '/davomat') {
      if (!student) {
        await this.sendMessage(chatId, `O‘quvchi ma’lumotlari topilmadi.`, quickReplyKeyboard);
        return;
      }

      const attendances = await this.prisma.attendance.findMany({
        where: { studentId: student.id },
        include: { group: true },
        orderBy: { date: 'desc' },
        take: 10,
      });

      const presentCount = attendances.filter((a) => a.status === 'present').length;
      const lateCount = attendances.filter((a) => a.status === 'late').length;
      const absentCount = attendances.filter((a) => a.status === 'absent').length;
      const total = attendances.length;
      const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 100;

      const historyLines =
        attendances.length > 0
          ? attendances
              .slice(0, 7)
              .map((a) => {
                const d = new Date(a.date).toLocaleDateString('uz-UZ');
                const icon =
                  a.status === 'present'
                    ? '✅ Keldi'
                    : a.status === 'late'
                    ? '⏳ Kechikdi'
                    : '❌ Kelmadi';
                return `• <b>${d}</b> (${a.group?.name || 'Dars'}) — ${icon}`;
              })
              .join('\n')
          : '• Hozircha davomat qayd etilmagan (100% faol)';

      await this.sendMessage(
        chatId,
        `📊 <b>${student.fullName} — Davomat Ko‘rsatkichi</b>\n\n🎯 <b>Davomat foizi:</b> ${rate}%\n✅ <b>Qatnashgan:</b> ${presentCount} ta dars\n⏳ <b>Kechikkan:</b> ${lateCount} ta dars\n❌ <b>Qoldirgan:</b> ${absentCount} ta dars\n\n📅 <b>Oxirgi darslar tarixi:</b>\n${historyLines}${demoNotice}`,
        quickReplyKeyboard,
      );
      return;
    }

    // 10. TO'LOV VA QARZDORLIK (Oxirgi kvitansiyalar bilan)
    if (text.includes('To‘lov & Qarz') || text === '/tolov') {
      if (!student) {
        await this.sendMessage(chatId, `O‘quvchi ma’lumotlari topilmadi.`, quickReplyKeyboard);
        return;
      }

      const bal = Number(student.balance || 0);
      const balStatus =
        bal < 0
          ? `🔴 <b>Qarzdorlik mavjud:</b> ${bal.toLocaleString()} so‘m`
          : `🟢 <b>Hisob balansi ijobiy:</b> +${bal.toLocaleString()} so‘m`;

      const payHistory =
        student.payments && student.payments.length > 0
          ? student.payments
              .filter((p: any) => Number(p.amount) > 0)
              .slice(0, 4)
              .map(
                (p: any) =>
                  `• <b>+${Number(p.amount).toLocaleString()} so‘m</b> (${String(
                    p.paymentMethod,
                  ).toUpperCase()}) — ${new Date(p.paidAt).toLocaleDateString('uz-UZ')}`,
              )
              .join('\n')
          : '• Hozircha to‘lovlar tarixi mavjud emas';

      await this.sendMessage(
        chatId,
        `💰 <b>${student.fullName} — Moliya va To‘lovlar Ma’lumoti</b>\n\n${balStatus}\n\n🧾 <b>So‘nggi amalga oshirilgan to‘lovlar:</b>\n${payHistory}${demoNotice}`,
        quickReplyKeyboard,
      );
      return;
    }

    // 11. QR-SERTIFIKATLAR (eski "Reyting & Sertifikat" tugmasi va /reyting ham shu yerga keladi)
    if (
      text.includes('Sertifikatlar') ||
      text.includes('Reyting & Sertifikat') ||
      text === '/sertifikat' ||
      text === '/reyting'
    ) {
      if (!student) {
        await this.sendMessage(chatId, `O‘quvchi ma’lumotlari topilmadi.`, quickReplyKeyboard);
        return;
      }

      const certs = student.certificates || [];
      const certLines =
        certs.length > 0
          ? certs
              .map(
                (c: any) =>
                  `🏅 <b>${c.courseTitle}</b> (Daraja: ${c.grade || 'A+'})\n🔗 Tekshirish: ${webAppUrl}/verify/${c.certificateNumber}`,
              )
              .join('\n\n')
          : '• Kursni tamomlagach, bu yerda rasmiy QR-Sertifikat paydo bo‘ladi.';

      await this.sendMessage(
        chatId,
        `🎓 <b>${student.fullName} — Sertifikatlar</b>\n\n📜 <b>Rasmiy QR-Sertifikatlar:</b>\n${certLines}${demoNotice}`,
        quickReplyKeyboard,
      );
      return;
    }

    // 11b. Ota-onaning ustozga xabari: haqiqatan saqlanadi (o'quvchi izohiga, sana bilan) —
    // markaz va ustoz uni platformada ko'radi. Avval bot "yetkazildi" derdi, lekin xabar hech qayerga bormasdi.
    const lower = text.toLowerCase();
    const isTeacherNote =
      /^ustozga\s+xabar/.test(lower) ||
      ['kechik', 'kelolmay', 'kelmaydi', 'bormay', 'kasal'].some((w) => lower.includes(w));
    if (student && isTeacherNote) {
      const body = text.replace(/^ustozga\s+xabar\s*[:\-–]?\s*/i, '').trim().slice(0, 500);
      if (body.length < 3) {
        await this.sendMessage(
          chatId,
          `✍️ Xabaringizni shunday yozing:\n<b>Ustozga xabar: Farzandim bugun 10 daqiqa kechikadi</b>`,
          quickReplyKeyboard,
        );
        return;
      }
      const now = new Date();
      const stamp = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const line = `[${stamp} ota-ona xabari] ${body}`;
      const notes = student.notes ? `${student.notes}\n${line}` : line;
      await this.prisma.student.update({
        where: { id: student.id },
        data: { notes: notes.slice(-2000) },
      });
      const teacherName = student.groups?.[0]?.group?.teacher?.fullName;
      const contactPhone = student.groups?.[0]?.group?.teacher?.phone || (student as any).center?.phone;
      await this.sendMessage(
        chatId,
        `✅ <b>Xabaringiz qabul qilindi.</b>\n\n<b>${student.fullName}</b> haqidagi xabaringiz markazga yozib qo‘yildi${teacherName ? ` — ustoz <b>${teacherName}</b> uni platformada ko‘radi` : ''}.` +
          (contactPhone ? `\n\nShoshilinch bo‘lsa, qo‘ng‘iroq qiling: ${contactPhone}` : ''),
        quickReplyKeyboard,
      );
      return;
    }

    // 12. Ota-onadan kelgan boshqa har qanday erkin savol (AI tahlili)
    try {
      const attendances = student
        ? await this.prisma.attendance.findMany({
            where: { studentId: student.id },
            orderBy: { date: 'desc' },
            take: 10,
          })
        : [];

      // Faqat o'quvchining o'z markazi kurslari (avval barcha markazlarning kurslari aralash chiqardi)
      const allCourses = student
        ? await this.prisma.course.findMany({ where: { centerId: student.centerId }, take: 10 })
        : [];

      const groupInfo = student?.groups?.[0]?.group;
      const teacher = groupInfo?.teacher;

      const aiResponse = await this.aiService.chatParentBot(text, {
        student,
        groupInfo,
        teacher,
        attendances,
        allCourses,
        center: (student as any)?.center,
      });

      await this.sendMessage(chatId, aiResponse + demoNotice, quickReplyKeyboard);
    } catch (err: any) {
      this.logger.error(`AI muloqot xatosi: ${err.message}`);
      await this.sendMessage(
        chatId,
        `Kechirasiz, savolingizni tushunishda xatolik yuz berdi. Iltimos pastdagi tugmalardan birini tanlang.`,
        quickReplyKeyboard,
      );
    }
  }
}
