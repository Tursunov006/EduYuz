"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor(configService, prisma, aiService) {
        this.configService = configService;
        this.prisma = prisma;
        this.aiService = aiService;
        this.logger = new common_1.Logger(TelegramService_1.name);
        this.botToken = null;
        this.isPolling = false;
    }
    onModuleInit() {
        this.botToken =
            this.configService.get('TELEGRAM_BOT_TOKEN') ||
                '8842750173:AAHo7Ep8GNuvrs1wdBhdmt10OCSQedGceoU';
        if (!this.botToken || this.botToken.includes('YOUR_TELEGRAM_BOT_TOKEN')) {
            this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN sozlanmagan. Telegram xabarlar simulyatsiya (console) rejimida ishlaydi.');
        }
        else {
            this.logger.log('🤖 Telegram Bot muvaffaqiyatli ulandi!');
            this.startPolling();
        }
    }
    async sendMessage(chatId, text, replyMarkup) {
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
        }
        catch (err) {
            this.logger.error(`Telegram API xatoligi: ${err.message}`);
            return false;
        }
    }
    async sendAttendanceAlert(parentChatId, studentName, groupName, status, date) {
        if (!parentChatId)
            return;
        let statusText = '';
        if (status === 'absent' || status === 'ABSENT') {
            statusText = '❌ <b>Darsga qatnashmadi (Kelmadi)</b>';
        }
        else if (status === 'late' || status === 'LATE') {
            statusText = '⏳ <b>Darsga kechikib keldi</b>';
        }
        else {
            return;
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
    async sendPaymentReceipt(parentChatId, studentName, amount, method, newBalance, comment) {
        if (!parentChatId)
            return;
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
    async sendDebtAlert(parentChatId, studentName, debtAmount, groupName) {
        if (!parentChatId)
            return;
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
    async startPolling() {
        if (this.isPolling)
            return;
        this.isPolling = true;
        let offset = 0;
        const poll = async () => {
            try {
                if (!this.botToken)
                    return;
                const res = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=20`);
                const data = await res.json();
                if (data.ok && data.result?.length > 0) {
                    for (const update of data.result) {
                        offset = update.update_id + 1;
                        await this.handleUpdate(update);
                    }
                }
            }
            catch (err) {
            }
            finally {
                setTimeout(poll, 1500);
            }
        };
        poll();
    }
    async handleUpdate(update) {
        const msg = update.message;
        if (!msg)
            return;
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();
        const contact = msg.contact;
        const webAppUrl = this.configService.get('TELEGRAM_WEBAPP_URL') || 'https://eduyuz.uz';
        const quickReplyKeyboard = {
            keyboard: [
                [{ text: '📊 Farzandim Davomati' }, { text: '💰 To‘lov & Qarz' }],
                [{ text: '👨‍🏫 Ustozi Haqida' }, { text: '🪙 Yutuq va Ballar' }],
                [{ text: '🏫 Markaz Kurslari' }, { text: '📱 Mini Ilova (/app)' }],
            ],
            resize_keyboard: true,
        };
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
                await this.sendMessage(chatId, `✅ <b>Tabriklaymiz! Siz muvaffaqiyatli ulandingiz!</b>\n\nFarzandingiz: <b>${student.fullName}</b>\n\nEndi farzandingizning davomati, to‘lovlari, baholari yoki o‘quv markazimiz bo‘yicha istalgan savolingizni shu yerga yozishingiz mumkin! 🚀`, quickReplyKeyboard);
                return;
            }
        }
        if (text.startsWith('/start student_')) {
            const studentId = text.replace('/start student_', '').trim();
            const student = await this.prisma.student.findUnique({ where: { id: studentId } });
            if (student) {
                await this.prisma.student.update({
                    where: { id: studentId },
                    data: { parentChatId: BigInt(chatId) },
                });
                await this.sendMessage(chatId, `✅ <b>Assalomu alaykum!</b>\nSiz muvaffaqiyatli tarzda <b>${student.fullName}</b> o'quvchisining ota-onasi sifatida ro'yxatdan o'tdingiz.\n\nFarzandingizning davomati, baholari va to'lovlari haqidagi barcha xabarlar shu yerga yetkaziladi.`, quickReplyKeyboard);
                return;
            }
        }
        if (text === '/start') {
            await this.sendMessage(chatId, `👋 <b>Assalomu alaykum, hurmatli ota-ona!</b>\n\nBu <b>EduYuz AI</b> rasmiy ota-onalar yordamchisi botidir.\n\nMen orqali farzandingizning:\n• 📊 Davomati va yo‘qlamasi\n• 💰 Oylik to‘lov va qarzi\n• 🪙 To‘plagan EduCoin tangalari\n• 👨‍🏫 Ustozi bilan bog‘lanish\n• 🏫 O‘quv markazimiz kurslari\nhaqida istalgan vaqtda ma'lumot olishingiz mumkin!\n\nPastdagi tugmalardan foydalaning yoki savolingizni to‘g‘ridan-to‘g‘ri yozing:`, quickReplyKeyboard);
            return;
        }
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
            await this.sendMessage(chatId, `📱 <b>EduYuz Mobil Mini Ilovasi:</b>\n\nFarzandingiz video darslarni ko‘rishi, interaktiv o‘yinlar o‘ynashi, uyga vazifalarni topshirishi va AI Repetitor bilan suhbatlashishi uchun quyidagi tugmani bosing:`, inlineButtons);
            return;
        }
        try {
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
            const attendances = student
                ? await this.prisma.attendance.findMany({
                    where: { studentId: student.id },
                    orderBy: { date: 'desc' },
                    take: 10,
                })
                : [];
            const allCourses = await this.prisma.course.findMany({
                take: 6,
            });
            const groupInfo = student?.groups?.[0]?.group;
            const teacher = groupInfo?.teacher;
            const aiResponse = await this.aiService.chatParentBot(text, {
                student,
                groupInfo,
                teacher,
                attendances,
                allCourses,
            });
            await this.sendMessage(chatId, aiResponse, quickReplyKeyboard);
        }
        catch (err) {
            this.logger.error(`AI muloqot xatosi: ${err.message}`);
            await this.sendMessage(chatId, `Kechirasiz, savolingizni tushunishda xatolik yuz berdi. Iltimos qayta yozib ko'ring yoki ma'muriyat bilan bog'laning.`, quickReplyKeyboard);
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        ai_service_1.AiService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map