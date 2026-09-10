import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string | null = null;
  private isPolling = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private aiService: AiService,
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
    const text = (msg.text || '').trim();
    const contact = msg.contact;
    const webAppUrl = this.configService.get<string>('TELEGRAM_WEBAPP_URL') || '';

    // Qulay tezkor javob tugmalari (Reply Keyboard)
    const quickReplyKeyboard = {
      keyboard: [
        [{ text: '📊 Farzandim Davomati' }, { text: '💰 To‘lov & Qarz' }],
        [{ text: '👨‍🏫 Ustozi Haqida' }, { text: '🪙 Yutuq va Ballar' }],
        [{ text: '🏫 Markaz Kurslari' }, { text: '📱 Mini Ilova (/app)' }],
      ],
      resize_keyboard: true,
    };

    // 1. Ota-ona telefon raqamini ulashganda
    if (contact && contact.phone_number) {
      const cleanPhone = contact.phone_number.replace(/\D/g, '');
      const student = await this.prisma.student.findFirst({
        where: {
          OR: [
            { phone: { contains: cleanPhone.slice(-9) } },
            { parentPhone: { contains: cleanPhone.slice(-9) } },
          ],
        },
      });

      if (student) {
        await this.prisma.student.update({
          where: { id: student.id },
          data: { parentChatId: BigInt(chatId) },
        });

        await this.sendMessage(
          chatId,
          `✅ <b>Tabriklaymiz! Siz muvaffaqiyatli ulandingiz!</b>\n\nFarzandingiz: <b>${student.fullName}</b>\n\nEndi farzandingizning davomati, to‘lovlari, baholari yoki o‘quv markazimiz bo‘yicha istalgan savolingizni shu yerga yozishingiz mumkin! 🚀`,
          quickReplyKeyboard,
        );
        return;
      }
    }

    // 2. /start student_UUID (O'quvchi orqali maxsus ulanish)
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
          `✅ <b>Assalomu alaykum!</b>\nSiz muvaffaqiyatli tarzda <b>${student.fullName}</b> o'quvchisining ota-onasi sifatida ro'yxatdan o'tdingiz.\n\nFarzandingizning davomati, baholari va to'lovlari haqidagi barcha xabarlar shu yerga yetkaziladi.`,
          quickReplyKeyboard,
        );
        return;
      }
    }

    // 3. Standart /start komandasi
    if (text === '/start') {
      await this.sendMessage(
        chatId,
        `👋 <b>Assalomu alaykum, hurmatli ota-ona!</b>\n\nBu <b>EduYuz AI</b> rasmiy ota-onalar yordamchisi botidir.\n\nMen orqali farzandingizning:\n• 📊 Davomati va yo‘qlamasi\n• 💰 Oylik to‘lov va qarzi\n• 🪙 To‘plagan EduCoin tangalari\n• 👨‍🏫 Ustozi bilan bog‘lanish\n• 🏫 O‘quv markazimiz kurslari\nhaqida istalgan vaqtda ma'lumot olishingiz mumkin!\n\nPastdagi tugmalardan foydalaning yoki savolingizni to‘g‘ridan-to‘g‘ri yozing:`,
        quickReplyKeyboard,
      );
      return;
    }

    // 4. Mini Ilova (/app) so'ralganda
    if (text.includes('Mini Ilova') || text === '/app') {
      const inlineButtons = webAppUrl.startsWith('https://')
        ? {
            inline_keyboard: [
              [
                {
                  text: '🚀 EduYuz Mini Ilovasini Ochish',
                  web_app: { url: `${webAppUrl}/app` },
                },
              ],
            ],
          }
        : {
            inline_keyboard: [
              [
                {
                  text: '🌐 EduYuz Portalini Ochish',
                  url: 'http://localhost:3001/app',
                },
              ],
            ],
          };

      await this.sendMessage(
        chatId,
        `📱 <b>EduYuz Mobil Mini Ilovasi:</b>\n\nFarzandingiz video darslarni ko‘rishi, interaktiv o‘yinlar o‘ynashi, uyga vazifalarni topshirishi va AI Repetitor bilan suhbatlashishi uchun quyidagi tugmani bosing:`,
        inlineButtons,
      );
      return;
    }

    // 5. Ota-onadan kelgan har qanday erkin savol yoki tugma bosilishi (AI tahlili)
    try {
      // 5.1. Chat ID ga bog'langan talabani topish
      let student = await this.prisma.student.findFirst({
        where: { parentChatId: BigInt(chatId) },
        include: {
          groups: {
            include: {
              group: {
                include: {
                  course: true,
                  teacher: true,
                },
              },
            },
          },
        },
      });

      // Agar hali ulanmagan bo'lsa, sinov uchun birinchi faol talabani kontekstga olish
      if (!student) {
        student = await this.prisma.student.findFirst({
          where: { status: 'active' },
          include: {
            groups: {
              include: {
                group: {
                  include: {
                    course: true,
                    teacher: true,
                  },
                },
              },
            },
          },
        });
      }

      // 5.2. Davomat tarixi
      const attendances = student
        ? await this.prisma.attendance.findMany({
            where: { studentId: student.id },
            orderBy: { date: 'desc' },
            take: 10,
          })
        : [];

      // 5.3. Kurslar ro'yxati
      const allCourses = await this.prisma.course.findMany({
        take: 6,
      });

      const groupInfo = student?.groups?.[0]?.group;
      const teacher = groupInfo?.teacher;

      // 5.4. EduYuz AI orqali javob tayyorlash
      const aiResponse = await this.aiService.chatParentBot(text, {
        student,
        groupInfo,
        teacher,
        attendances,
        allCourses,
      });

      await this.sendMessage(chatId, aiResponse, quickReplyKeyboard);
    } catch (err: any) {
      this.logger.error(`AI muloqot xatosi: ${err.message}`);
      await this.sendMessage(
        chatId,
        `Kechirasiz, savolingizni tushunishda xatolik yuz berdi. Iltimos qayta yozib ko'ring yoki ma'muriyat bilan bog'laning.`,
        quickReplyKeyboard,
      );
    }
  }
}
