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
        this.userState = new Map();
    }
    async onModuleInit() {
        this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN')?.trim() || null;
        if (!this.botToken || this.botToken.includes('YOUR_TELEGRAM_BOT_TOKEN')) {
            this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN sozlanmagan. Telegram xabarlar simulyatsiya (console) rejimida ishlaydi.');
        }
        else {
            await this.clearWebhookAndSetupMenu();
            this.logger.log('🤖 EduYuz 2.0 Super Telegram Bot muvaffaqiyatli ulandi!');
            this.startPolling();
        }
    }
    async clearWebhookAndSetupMenu() {
        if (!this.botToken)
            return;
        try {
            await fetch(`https://api.telegram.org/bot${this.botToken}/deleteWebhook?drop_pending_updates=false`);
            await fetch(`https://api.telegram.org/bot${this.botToken}/setMyCommands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commands: [
                        { command: 'start', description: '🏠 Asosiy menyu va farzandni ulash' },
                        { command: 'davomat', description: '📊 Farzandim davomati va statistika' },
                        { command: 'jadval', description: '🗓 Dars jadvali va uyga vazifalar' },
                        { command: 'tolov', description: '💰 To‘lovlar tarixi va balans' },
                        { command: 'reyting', description: '🏆 EduCoin ballar va QR-Sertifikatlar' },
                        { command: 'kurslar', description: '🎁 Bepul sinov darsi (+100,000 so‘m vaucher)' },
                        { command: 'app', description: '📱 EduYuz Mobil Mini Ilovasi' },
                    ],
                }),
            });
        }
        catch (e) {
            this.logger.warn(`Webhook/Menu sozlashda xato: ${e.message}`);
        }
    }
    async updateBotToken(newToken) {
        if (!newToken || !/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(newToken.trim())) {
            return { success: false, message: 'Token formati noto‘g‘ri' };
        }
        this.botToken = newToken.trim();
        await this.clearWebhookAndSetupMenu();
        this.startPolling();
        return {
            success: true,
            message: 'Yangi Telegram Bot Token muvaffaqiyatli ulandi va himoyalandi!',
        };
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
        }
        catch (err) {
            this.logger.error(`Telegram API xatoligi: ${err.message}`);
            return false;
        }
    }
    async sendPhotoBase64(chatId, base64Data, caption) {
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
        }
        catch (err) {
            this.logger.error(`sendPhotoBase64 xatosi: ${err.message}`);
            return false;
        }
    }
    async sendAttendanceAlert(parentChatId, studentName, groupName, status, date) {
        if (!parentChatId)
            return;
        const normalized = status.toLowerCase();
        let statusText = '';
        let bonusLine = '';
        if (normalized === 'absent') {
            statusText = '❌ <b>Darsga qatnashmadi (Kelmadi)</b>';
            bonusLine = '\n⚠️ <i>Iltimos, dars qoldirish sababini ma’muriyatga ma’lum qiling.</i>';
        }
        else if (normalized === 'late') {
            statusText = '⏳ <b>Darsga kechikib keldi</b>';
        }
        else if (normalized === 'present') {
            statusText = '✅ <b>Darsga o‘z vaqtida yetib keldi!</b>';
            bonusLine = '\n🪙 <b>Bonus:</b> Farzandingizga <b>+10 EduCoin</b> rag‘bat balli qo‘shildi!';
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
📊 <b>Holati:</b> ${statusText}${bonusLine}

<i>O'quv markazi ma'muriyati</i>
    `.trim();
        await this.sendMessage(parentChatId, message);
    }
    async sendPaymentReceipt(parentChatId, studentName, amount, method, newBalance, comment) {
        if (!parentChatId)
            return;
        const message = `
🧾 <b>EduYuz — Rasmiy Elektron Kvitansiya</b>

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
    async findLinkedStudent(chatId) {
        let student = await this.prisma.student.findFirst({
            where: { parentChatId: BigInt(chatId) },
            include: {
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
    async handleUpdate(update) {
        const msg = update.message;
        if (!msg)
            return;
        const chatId = msg.chat.id;
        const chatKey = String(chatId);
        const text = (msg.text || '').trim();
        const contact = msg.contact;
        const senderName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
            msg.from?.username ||
            'Telegram Foydalanuvchi';
        const webAppUrl = this.configService.get('TELEGRAM_WEBAPP_URL') || 'https://eduyuz.uz';
        const quickReplyKeyboard = {
            keyboard: [
                [
                    { text: '📲 Farzandimni Ulash (Telefon)', request_contact: true },
                    { text: '📊 Farzandim Davomati' },
                ],
                [{ text: '🗓 Dars Jadvali & Vazifa' }, { text: '💰 To‘lov & Qarz' }],
                [{ text: '🏆 Reyting & Sertifikat' }, { text: '👨‍🏫 Ustozi Haqida' }],
                [{ text: '🎁 Bepul Darsga Yozilish' }, { text: '📩 Direktorga Murojaat' }],
                [{ text: '🏫 Markaz Kurslari' }, { text: '📱 Mini Ilova (/app)' }],
            ],
            resize_keyboard: true,
        };
        if (contact && contact.phone_number) {
            if (!contact.user_id || contact.user_id !== msg.from?.id) {
                await this.sendMessage(chatId, `⚠️ Iltimos, boshqa kontaktni emas, pastdagi <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasi orqali <b>o‘z raqamingizni</b> yuboring.`, quickReplyKeyboard);
                return;
            }
            const cleanPhone = contact.phone_number.replace(/\D/g, '');
            const last9 = cleanPhone.slice(-9);
            const students = last9.length < 9 ? [] : await this.prisma.student.findMany({
                where: {
                    OR: [{ phone: { endsWith: last9 } }, { parentPhone: { endsWith: last9 } }],
                },
                include: {
                    groups: { include: { group: { include: { course: true, teacher: true } } } },
                },
            });
            if (students.length > 0) {
                for (const st of students) {
                    await this.prisma.student.update({
                        where: { id: st.id },
                        data: { parentChatId: BigInt(chatId) },
                    });
                }
                const namesList = students
                    .map((s) => `• <b>${s.fullName}</b> (${s.groups?.[0]?.group?.name || 'Guruhga biriktirilgan'} | Balans: ${Number(s.balance).toLocaleString()} so‘m | 🪙 ${s.coins} Coin)`)
                    .join('\n');
                await this.sendMessage(chatId, `✅ <b>Tabriklaymiz! Telefon raqamingiz (+${cleanPhone}) tasdiqlandi!</b>\n\n👨‍👩‍👧 Sizga biriktirilgan o‘quvchi(lar):\n${namesList}\n\nEndi pastdagi tugmalar orqali farzandingizning kunlik davomati, dars jadvali, uyga vazifalari, to‘lovlari va sertifikatlarini 24/7 kuzatib borishingiz mumkin! 🚀`, quickReplyKeyboard);
                return;
            }
            else {
                try {
                    let center = await this.prisma.center.findFirst();
                    if (center) {
                        const payload = JSON.stringify({
                            name: senderName,
                            course: 'Telegram Bot (Bepul Dars)',
                            source: 'Telegram Bot (@EduYuz)',
                            notes: `Telegram orqali raqam qoldirdi. ChatID: ${chatId}. Vaucher: EDUYUZ100`,
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
                }
                catch (e) { }
                await this.sendMessage(chatId, `🎉 <b>Arizangiz qabul qilindi, ${senderName}!</b>\n\n📞 Telefon raqamingiz (<b>+${cleanPhone}</b>) o‘quv markazimizning <b>«Bepul Sinov Darsi»</b> ro‘yxatiga qo‘shildi!\n\n🎟 <b>Sizning 100,000 so‘mlik vaucher kodingiz:</b> <code>EDUYUZ100</code>\n\nTez orada menejerlarimiz siz bilan bog‘lanib, o‘zingizga qulay dars vaqtini belgilab berishadi!`, quickReplyKeyboard);
                return;
            }
        }
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
            }
            catch { }
            await this.sendMessage(chatId, `✅ <b>Murojaatingiz to‘g‘ridan-to‘g‘ri Markaz Rahbariyatiga yetkazildi!</b>\n\n📝 <i>"${text}"</i>\n\nE’tiboringiz va fikringiz uchun rahmat. Ma’muriyatimiz tez orada sizga javob qaytaradi! 🙏`, quickReplyKeyboard);
            return;
        }
        if (text.startsWith('/start student_')) {
            const studentId = text.replace('/start student_', '').trim();
            const student = await this.prisma.student.findUnique({ where: { id: studentId } });
            if (student) {
                await this.prisma.student.update({
                    where: { id: studentId },
                    data: { parentChatId: BigInt(chatId) },
                });
                await this.sendMessage(chatId, `✅ <b>Assalomu alaykum!</b>\nSiz muvaffaqiyatli tarzda <b>${student.fullName}</b> o'quvchisining ota-onasi sifatida ro'yxatdan o'tdingiz.\n\nFarzandingizning davomati, dars jadvali, baholari va to'lovlari haqidagi barcha xabarlar shu yerga yetkaziladi.`, quickReplyKeyboard);
                return;
            }
        }
        if (text === '/start') {
            const linked = await this.findLinkedStudent(chatId);
            const linkedBanner = linked
                ? `\n\n👨‍🎓 <b>Bog‘langan farzandingiz:</b> ${linked.fullName} (🪙 ${linked.coins} EduCoin)`
                : `\n\n👉 <b>Farzandingizni ulash uchun</b> pastdagi <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasini bosing!`;
            await this.sendMessage(chatId, `👋 <b>Assalomu alaykum, hurmatli ota-ona va o‘quvchilar!</b>\n\nBu <b>EduYuz CRM</b> rasmiy ta’lim va nazorat botidir.${linkedBanner}\n\nMen orqali:\n• 📊 <b>Kunlik Davomat</b> (keldi/kelmadi hisoboti)\n• 🗓 <b>Dars Jadvali va Uyga Vazifalar (LMS)</b>\n• 💰 <b>Oylik To‘lovlar, Balans va Kvitansiyalar</b>\n• 🏆 <b>Reyting, EduCoin tangalar va QR-Sertifikatlar</b>\n• 🎁 <b>Bepul Sinov Darsiga Yozilish (+100,000 so‘m vaucher)</b>\nxizmatlaridan foydalanishingiz mumkin!`, quickReplyKeyboard);
            return;
        }
        if (text.includes('Mini Ilova') || text === '/app') {
            const linked = await this.findLinkedStudent(chatId);
            if (!linked) {
                await this.sendMessage(chatId, `📱 Mini ilovani ochish uchun avval <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasi orqali farzandingiz profilini ulang.`, quickReplyKeyboard);
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
            await this.sendMessage(chatId, `📱 <b>EduYuz Mobil Mini Ilovasi va Portali:</b>\n\nFarzandingiz video darslarni ko‘rishi, interaktiv o‘yinlar o‘ynashi, uyga vazifalarni topshirishi va AI Repetitor bilan suhbatlashishi uchun quyidagi tugmani bosing:`, inlineButtons);
            return;
        }
        if (text.includes('Bepul Darsga Yozilish') || text === '/kurslar') {
            const courses = await this.prisma.course.findMany({ take: 8 });
            const courseLines = courses.length > 0
                ? courses
                    .map((c, i) => `${i + 1}. 📚 <b>${c.title}</b> — ${Number(c.price).toLocaleString()} so‘m/oy`)
                    .join('\n')
                : `1. 📚 <b>Frontend & Web Dasturlash</b> — 500,000 so‘m/oy\n2. 📚 <b>Python & Sun’iy Intellekt</b> — 500,000 so‘m/oy\n3. 📚 <b>Ingliz tili & IELTS Bootcamp</b> — 450,000 so‘m/oy`;
            await this.sendMessage(chatId, `🎁 <b>BEPUL SINOV DARSI VA 100,000 SO‘M VAUCHER!</b>\n\nO‘quv markazimizdagi barcha yo‘nalishlarning 1-darsi <b>100% BEPUL</b>:\n\n${courseLines}\n\n🎟 <b>Maxsus promokod:</b> <code>EDUYUZ100</code> (1-oy uchun 100,000 so‘m chegirma!)\n\n👇 <b>Ro‘yxatdan o‘tish uchun</b> pastdagi chap burchakdagi <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasini bosing yoki telefon raqamingizni shu yerga yozib yuboring!`, quickReplyKeyboard);
            return;
        }
        if (text.includes('Direktorga Murojaat')) {
            this.userState.set(chatKey, 'awaiting_feedback');
            await this.sendMessage(chatId, `📩 <b>Markaz Direktoriga To‘g‘ridan-To‘g‘ri Murojaat:</b>\n\nDars sifati, ustozlar faoliyati bo‘yicha taklif, savol yoki e’tirozingizni shu yerga bitta xabar qilib yozib yuboring.\n\n<i>Xabaringiz darhol markaz rahbariyatiga yetkaziladi:</i>`, quickReplyKeyboard);
            return;
        }
        const student = await this.findLinkedStudent(chatId);
        const demoNotice = '';
        const isPersonalCommand = text.includes('Dars Jadvali') ||
            text === '/jadval' ||
            text.includes('Farzandim Davomati') ||
            text === '/davomat' ||
            text.includes('To‘lov & Qarz') ||
            text === '/tolov' ||
            text.includes('Reyting & Sertifikat') ||
            text.includes('Yutuq va Ballar') ||
            text === '/reyting';
        if (!student && isPersonalCommand) {
            await this.sendMessage(chatId, `🔒 Bu bo‘lim faqat farzandi ulangan ota-onalar uchun.

Iltimos, avval pastdagi <b>«📲 Farzandimni Ulash (Telefon)»</b> tugmasini bosib, markazga bergan telefon raqamingizni tasdiqlang.`, quickReplyKeyboard);
            return;
        }
        if (text.includes('Dars Jadvali') || text === '/jadval') {
            if (!student || !student.groups || student.groups.length === 0) {
                await this.sendMessage(chatId, `🗓 <b>Dars Jadvali:</b>\nHozircha o‘quvchi hech qaysi guruhga biriktirilmagan.${demoNotice}`, quickReplyKeyboard);
                return;
            }
            const scheduleBlocks = student.groups
                .map((sg) => {
                const g = sg.group;
                const daysStr = Array.isArray(g.days) ? g.days.join(', ') : g.days || 'Dush-Chor-Jum';
                const lessons = g.lessons || [];
                const latestLesson = lessons[0];
                const hwText = latestLesson
                    ? `\n📖 <b>Oxirgi mavzu:</b> ${latestLesson.title}\n📝 <b>Uyga vazifa:</b> ${latestLesson.homework || 'Mavzuni takrorlash va amaliy mashqlar'}`
                    : `\n📝 <b>Uyga vazifa:</b> Joriy dars konspektini takrorlash`;
                return `📚 <b>Guruh:</b> ${g.name} (${g.course?.title || 'Kurs'})\n🗓 <b>Kunlari:</b> ${daysStr}\n🕒 <b>Dars vaqti:</b> ${g.startTime || '14:00'} — ${g.endTime || '16:00'}\n👨‍🏫 <b>Ustoz:</b> ${g.teacher?.fullName || 'Biriktirilgan ustoz'}${hwText}`;
            })
                .join('\n\n──────────────────\n\n');
            await this.sendMessage(chatId, `🗓 <b>${student.fullName} — Dars Jadvali va Uyga Vazifalar (LMS)</b>\n\n${scheduleBlocks}${demoNotice}`, quickReplyKeyboard);
            return;
        }
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
            const historyLines = attendances.length > 0
                ? attendances
                    .slice(0, 7)
                    .map((a) => {
                    const d = new Date(a.date).toLocaleDateString('uz-UZ');
                    const icon = a.status === 'present'
                        ? '✅ Keldi'
                        : a.status === 'late'
                            ? '⏳ Kechikdi'
                            : '❌ Kelmadi';
                    return `• <b>${d}</b> (${a.group?.name || 'Dars'}) — ${icon}`;
                })
                    .join('\n')
                : '• Hozircha davomat qayd etilmagan (100% faol)';
            await this.sendMessage(chatId, `📊 <b>${student.fullName} — Davomat Ko‘rsatkichi</b>\n\n🎯 <b>Davomat foizi:</b> ${rate}%\n✅ <b>Qatnashgan:</b> ${presentCount} ta dars\n⏳ <b>Kechikkan:</b> ${lateCount} ta dars\n❌ <b>Qoldirgan:</b> ${absentCount} ta dars\n\n📅 <b>Oxirgi darslar tarixi:</b>\n${historyLines}${demoNotice}`, quickReplyKeyboard);
            return;
        }
        if (text.includes('To‘lov & Qarz') || text === '/tolov') {
            if (!student) {
                await this.sendMessage(chatId, `O‘quvchi ma’lumotlari topilmadi.`, quickReplyKeyboard);
                return;
            }
            const bal = Number(student.balance || 0);
            const balStatus = bal < 0
                ? `🔴 <b>Qarzdorlik mavjud:</b> ${bal.toLocaleString()} so‘m`
                : `🟢 <b>Hisob balansi ijobiy:</b> +${bal.toLocaleString()} so‘m`;
            const payHistory = student.payments && student.payments.length > 0
                ? student.payments
                    .filter((p) => Number(p.amount) > 0)
                    .slice(0, 4)
                    .map((p) => `• <b>+${Number(p.amount).toLocaleString()} so‘m</b> (${String(p.paymentMethod).toUpperCase()}) — ${new Date(p.paidAt).toLocaleDateString('uz-UZ')}`)
                    .join('\n')
                : '• Hozircha to‘lovlar tarixi mavjud emas';
            await this.sendMessage(chatId, `💰 <b>${student.fullName} — Moliya va To‘lovlar Ma’lumoti</b>\n\n${balStatus}\n\n🧾 <b>So‘nggi amalga oshirilgan to‘lovlar:</b>\n${payHistory}${demoNotice}`, quickReplyKeyboard);
            return;
        }
        if (text.includes('Reyting & Sertifikat') || text.includes('Yutuq va Ballar') || text === '/reyting') {
            if (!student) {
                await this.sendMessage(chatId, `O‘quvchi ma’lumotlari topilmadi.`, quickReplyKeyboard);
                return;
            }
            const allStudents = await this.prisma.student.findMany({
                where: { centerId: student.centerId, status: 'active' },
                orderBy: { coins: 'desc' },
                select: { id: true, fullName: true, coins: true },
            });
            const rankIndex = allStudents.findIndex((s) => s.id === student.id);
            const rank = rankIndex >= 0 ? rankIndex + 1 : 1;
            const certs = student.certificates || [];
            const certLines = certs.length > 0
                ? certs
                    .map((c) => `🏅 <b>${c.courseTitle}</b> (Daraja: ${c.grade || 'A+'})\n🔗 Tekshirish: ${webAppUrl}/verify/${c.certificateNumber}`)
                    .join('\n\n')
                : '• Kursni tamomlagach, bu yerda rasmiy QR-Sertifikat paydo bo‘ladi.';
            await this.sendMessage(chatId, `🏆 <b>${student.fullName} — Reyting va Yutuqlar</b>\n\n🪙 <b>To‘plangan EduCoinlar:</b> ${student.coins || 0} ta tanga\n🥇 <b>Markaz bo‘yicha o‘rni:</b> ${rank}-o‘rin (jami ${allStudents.length} o‘quvchi ichida)\n\n📜 <b>Rasmiy QR-Sertifikatlar:</b>\n${certLines}${demoNotice}`, quickReplyKeyboard);
            return;
        }
        try {
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
            await this.sendMessage(chatId, aiResponse + demoNotice, quickReplyKeyboard);
        }
        catch (err) {
            this.logger.error(`AI muloqot xatosi: ${err.message}`);
            await this.sendMessage(chatId, `Kechirasiz, savolingizni tushunishda xatolik yuz berdi. Iltimos pastdagi tugmalardan birini tanlang.`, quickReplyKeyboard);
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