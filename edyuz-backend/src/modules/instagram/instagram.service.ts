import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface LeadRecord {
  id: string;
  fullName: string;
  phone: string;
  course: string;
  source: 'Instagram' | 'Telegram' | 'Tavsiya' | 'Qo\'ng\'iroq';
  stage: 'new' | 'contacted' | 'trial' | 'converted';
  createdAt: string;
  note?: string;
  igUsername?: string;
}

const STAGE_TO_STATUS: Record<string, string> = {
  new: 'lead_new',
  contacted: 'lead_contacted',
  trial: 'lead_trial',
  converted: 'lead_converted',
};

const STATUS_TO_STAGE: Record<string, LeadRecord['stage']> = {
  lead_new: 'new',
  lead_contacted: 'contacted',
  lead_trial: 'trial',
  lead_converted: 'converted',
};

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // 1. Bazadan barcha lidlarni olish
  async getAllLeads(): Promise<LeadRecord[]> {
    const rows = await this.prisma.smsLog.findMany({
      where: {
        status: {
          in: ['lead_new', 'lead_contacted', 'lead_trial', 'lead_converted'],
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 200,
    });

    return rows.map((r) => this.mapRowToLead(r));
  }

  // 2. Yangi lid yaratish (Instagram Bio, AI Chat, Webhook yoki CRM ichidan)
  async createLead(dto: {
    fullName: string;
    phone: string;
    course?: string;
    source?: string;
    stage?: string;
    note?: string;
    igUsername?: string;
  }): Promise<LeadRecord> {
    const stageKey = dto.stage && STAGE_TO_STATUS[dto.stage] ? dto.stage : 'new';
    const status = STAGE_TO_STATUS[stageKey];
    const cleanPhone = (dto.phone || '+998').slice(0, 20);

    const payload = JSON.stringify({
      fullName: dto.fullName || 'Instagram Mijoz',
      course: dto.course || 'EduYuz CRM Demo',
      source: dto.source || 'Instagram',
      note: dto.note || '@eduyuzcrmuz orqali murojaat',
      igUsername: dto.igUsername || '',
    });

    const created = await this.prisma.smsLog.create({
      data: {
        phone: cleanPhone,
        message: payload,
        status,
      },
    });

    this.logger.log(`🎯 Yangi Lid saqlandi: ${dto.fullName} (${cleanPhone}) [${dto.source || 'Instagram'}]`);
    return this.mapRowToLead(created);
  }

  // 3. Lid bosqichini (stage) o'zgartirish
  async updateLeadStage(id: string, stage: string): Promise<LeadRecord | null> {
    const status = STAGE_TO_STATUS[stage] || 'lead_new';
    try {
      const updated = await this.prisma.smsLog.update({
        where: { id },
        data: { status },
      });
      return this.mapRowToLead(updated);
    } catch (err) {
      this.logger.warn(`Lid topilmadi (${id}): ${err.message}`);
      return null;
    }
  }

  // 4. Lidni o'chirish
  async deleteLead(id: string): Promise<{ deleted: boolean }> {
    try {
      await this.prisma.smsLog.delete({ where: { id } });
      return { deleted: true };
    } catch {
      return { deleted: false };
    }
  }

  // 5. Instagram Direct / Bio-Link uchun AI Sotuv Menejer (@eduyuzcrmuz)
  async chatInstagramSales(
    message: string,
    senderName?: string,
    igUsername?: string,
  ): Promise<{ reply: string; leadCreated?: LeadRecord }> {
    const text = (message || '').trim();
    const lower = text.toLowerCase();

    // Telefon raqam bor-yo'qligini tekshirish (masalan: 90 123 45 67 yoki +998901234567)
    const phoneMatch = text.match(/(?:\+?998[\s-]?)?(?:\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\d{9})/);
    let leadCreated: LeadRecord | undefined;

    if (phoneMatch) {
      const extractedPhone = phoneMatch[0].trim();
      leadCreated = await this.createLead({
        fullName: senderName || (igUsername ? `@${igUsername}` : 'Instagram Mijoz'),
        phone: extractedPhone,
        course: 'EduYuz CRM / Instagram DM',
        source: 'Instagram',
        note: `Instagram AI Chat orqali qoldirildi: "${text.slice(0, 100)}"`,
        igUsername,
      });

      return {
        reply: `✅ Rahmat! Raqamingiz (**${extractedPhone}**) qabul qilindi va **EduYuz CRM** tizimiga avtomatik kiritildi!\n\n👨‍💻 Mutaxassisimiz tez orada siz bilan bog'lanib, **14 kunlik BEPUL DEMO** akkauntingizni yoqib beradi.`,
        leadCreated,
      };
    }

    // Gemini API orqali javob berishga urinish
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Sen @eduyuzcrmuz (EduYuz CRM Platformasi) ning rasmiy Instagram AI Sotuv Menejerisan.
Vazifang: O'quv markazi rahbarlariga va mijozlarga EduYuz CRM imkoniyatlarini qisqa, samimiy va sotuvchi ohangda tushuntirish hamda ulardan telefon raqamini so'rab olish.
EduYuz CRM afzalliklari:
1. 📅 Kunlik Davomat va Ota-onalarga avtomatik Telegram/SMS xabar yuborish.
2. 💰 Moliya, Kassa, Oylik avto-yechim va Qarzdorlar nazorati.
3. 🎯 Lidlar voronkasi (Kanban) va Instagram integratsiya.
4. 🎮 Gamifikatsiya (EduCoins), Sertifikatlar va Ota-onalar portali.
5. 🎁 14 kunlik BEPUL sinov (Trial) mavjud! Narxi: oyiga atigi 299,000 so'mdan boshlanadi.

Mijoz xabari: "${text}"
Javobingni o'zbek tilida, 3-5 qatordan oshirmay, chiroyli emojilar bilan yoz va oxirida bepul demo olish uchun telefon raqamini yozib qoldirishni so'ra.`,
                    },
                  ],
                },
              ],
            }),
          },
        );
        const data = await res.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          return { reply: aiText };
        }
      } catch (e) {
        this.logger.warn(`Gemini Instagram AI fallback: ${e.message}`);
      }
    }

    // Smart Local Sales Fallback (API kalit bo'lmasa ham 100% mukammal ishlaydi)
    if (lower.includes('narx') || lower.includes('qancha') || lower.includes('tarif') || lower.includes('pul')) {
      return {
        reply: `💎 **EduYuz CRM tariflari:**\n\n• **START:** 299 000 so'm/oy (100 tagacha o'quvchi, Davomat, Kassa va Jadval)\n• **PRO BIZNES:** 499 000 so'm/oy (500 tagacha o'quvchi, AI, Telegram Bot, Instagram Voronka va Sertifikatlar)\n• **VIP / TARMOQ:** 899 000 so'm/oy (Cheksiz o'quvchilar va filiallar)\n\n🎁 **14 kunlik BEPUL DEMO** hoziroq tayyor! Sinab ko'rish uchun **telefon raqamingizni** yozib qoldiring 👇`,
      };
    }

    if (lower.includes('davomat') || lower.includes('bot') || lower.includes('sms')) {
      return {
        reply: `📅 **EduYuz Avtomatik Davomat va Ota-onalar Boti:**\n\nO'qituvchi 1 tugma bilan guruh davomatini belgilaydi va o'quvchining ota-onasiga darhol Telegram/SMS xabar yuboriladi.\n\n📱 O'z markazingizda 14 kun bepul sinab ko'rish uchun **telefon raqamingizni** yozib qoldiring!`,
      };
    }

    if (lower.includes('demo') || lower.includes('sinov') || lower.includes('ulash') || lower.includes('kerak') || lower === '+') {
      return {
        reply: `🚀 **Ajoyib tanlov!** EduYuz CRM tizimini 5 daqiqada o'quv markazingizga ulab, **14 kunlik BEPUL VIP-DEMO** ochib beramiz.\n\n📞 Iltimos, **ismingiz va telefon raqamingizni** (masalan: *+998 90 123 45 67*) shu yerga yozib yuboring!`,
      };
    }

    return {
      reply: `Assalomu alaykum! 👋 **@eduyuzcrmuz — EduYuz 2.0 CRM** rasmiy AI yordamchisiman.\n\nBiz o'quv markazlarni to'liq avtomatlashtiramiz:\n✅ **Avtomatik Davomat** va Ota-onalar Boti\n✅ **Aniq Moliya** va Qarzdorlar nazorati\n✅ **Lidlar Voronkasi (Kanban)** va Instagram integratsiyasi\n\n🎁 **14 kunlik bepul Demo** olish yoki savolingiz bo'lsa, **telefon raqamingizni** yozib qoldiring!`,
    };
  }

  // 6. Meta Graph API Webhook qabul qiluvchi (Instagram DM & Comments)
  async handleMetaWebhook(body: any): Promise<any> {
    this.logger.log(`📩 Meta Instagram Webhook keldi: ${JSON.stringify(body).slice(0, 300)}`);

    try {
      // A) ManyChat yoki To'g'ridan-to'g'ri Webhook JSON format bo'lsa
      if (body?.phone || body?.fullName || body?.igUsername) {
        const lead = await this.createLead({
          fullName: body.fullName || body.name || 'Instagram Mijoz',
          phone: body.phone || '+998',
          course: body.course || 'Instagram DM Murojaat',
          source: 'Instagram',
          note: body.message || body.note || '@eduyuzcrmuz webhook',
          igUsername: body.igUsername || body.username,
        });
        return { status: 'lead_saved', lead };
      }

      // B) Rasmiy Meta Instagram Messaging & Comments Webhook formati
      const entries = body?.entry || [];
      for (const entry of entries) {
        // 1. Direct (DM) xabarlar
        const messagingEvents = entry?.messaging || [];
        for (const event of messagingEvents) {
          const senderId = event?.sender?.id;
          const messageText = event?.message?.text;
          const isEcho = event?.message?.is_echo;

          if (senderId && messageText && !isEcho) {
            const aiRes = await this.chatInstagramSales(messageText, `IG #${senderId.slice(-4)}`, senderId);
            await this.sendInstagramDirectReply(senderId, aiRes.reply);
          }
        }

        // 2. Reels va Post ostidagi Kommentlar (Viral Obunachi Algoritmi: "CRM", "DEMO", "+")
        const changes = entry?.changes || [];
        for (const change of changes) {
          if (change?.field === 'comments' && change?.value) {
            const commentText = (change.value.text || '').toLowerCase();
            const commenterId = change.value.from?.id;
            const commenterUsername = change.value.from?.username || 'Instagram Foydalanuvchi';

            if (
              commenterId &&
              (commentText.includes('crm') ||
                commentText.includes('demo') ||
                commentText.includes('narx') ||
                commentText.includes('bonus') ||
                commentText.trim() === '+')
            ) {
              const dmText = `Salom @${commenterUsername}! 👋 @eduyuzcrmuz sahifamizga obuna bo'lganingiz uchun rahmat!\n\n🎁 Siz so'ragan **14 kunlik BEPUL DEMO** va **100,000 so'm Vaucher** mana bu yerda:\n👉 https://eduyuz.uz/insta\n\nShu xabarga **telefon raqamingizni** yozib yuboring, tizimni 5 daqiqada yoqib beramiz! 🚀`;
              await this.sendInstagramDirectReply(commenterId, dmText);
            }
          }
        }
      }
      return { status: 'EVENT_RECEIVED' };
    } catch (err) {
      this.logger.error(`Instagram webhook xatosi: ${err.message}`);
      return { status: 'ERROR', message: err.message };
    }
  }

  private async sendInstagramDirectReply(recipientId: string, text: string) {
    const token = this.configService.get<string>('INSTAGRAM_ACCESS_TOKEN');
    if (!token) {
      this.logger.log(`🤖 [IG DM Demo Reply -> ${recipientId}]: ${text}`);
      return;
    }

    try {
      await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      });
    } catch (err) {
      this.logger.warn(`IG Graph API send error: ${err.message}`);
    }
  }

  private mapRowToLead(row: { id: string; phone: string; message: string; status: string; sentAt: Date }): LeadRecord {
    let parsed: any = {};
    try {
      parsed = JSON.parse(row.message);
    } catch {
      parsed = { fullName: 'Instagram Mijoz', note: row.message };
    }

    return {
      id: row.id,
      fullName: parsed.fullName || 'Instagram Mijoz',
      phone: row.phone,
      course: parsed.course || 'EduYuz CRM Demo',
      source: parsed.source || 'Instagram',
      stage: STATUS_TO_STAGE[row.status] || 'new',
      createdAt: row.sentAt.toLocaleDateString('uz-UZ'),
      note: parsed.note || '',
      igUsername: parsed.igUsername || '',
    };
  }
}
