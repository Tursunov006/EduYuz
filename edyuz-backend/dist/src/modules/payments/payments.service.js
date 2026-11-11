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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const telegram_service_1 = require("../telegram/telegram.service");
const sms_service_1 = require("../sms/sms.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, telegramService, smsService, configService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.smsService = smsService;
        this.configService = configService;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    md5(value) {
        return (0, crypto_1.createHash)('md5').update(value).digest('hex');
    }
    safeEqual(a, b) {
        const x = Buffer.from(String(a || '').toLowerCase());
        const y = Buffer.from(String(b || '').toLowerCase());
        return x.length === y.length && (0, crypto_1.timingSafeEqual)(x, y);
    }
    async findByExternalRef(studentId, ref) {
        return this.prisma.payment.findFirst({
            where: { studentId, comment: { contains: `(Tr: ${ref})` } },
        });
    }
    async create(dto) {
        const student = await this.prisma.student.findUnique({
            where: { id: dto.studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('O\'quvchi topilmadi');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    studentId: dto.studentId,
                    amount: dto.amount,
                    paymentMethod: dto.paymentMethod,
                    comment: dto.comment,
                },
                include: {
                    student: true,
                },
            });
            const updatedStudent = await tx.student.update({
                where: { id: dto.studentId },
                data: {
                    balance: {
                        increment: dto.amount,
                    },
                },
            });
            return { payment, newBalance: Number(updatedStudent.balance) };
        });
        if (student.parentChatId) {
            this.telegramService
                .sendPaymentReceipt(student.parentChatId, student.fullName, dto.amount, dto.paymentMethod, result.newBalance, dto.comment)
                .catch((e) => this.logger.error(`Telegram to'lov cheki xatosi: ${e.message}`));
        }
        if (student.parentPhone) {
            this.smsService
                .sendPaymentReceipt(student.parentPhone, student.fullName, dto.amount, result.newBalance)
                .catch((e) => this.logger.error(`SMS to'lov cheki xatosi: ${e.message}`));
        }
        return result.payment;
    }
    async chargeMonthly(centerId, groupId) {
        const groups = await this.prisma.group.findMany({
            where: { centerId, ...(groupId ? { id: groupId } : {}) },
            include: {
                course: true,
                students: {
                    include: {
                        student: true,
                    },
                },
            },
        });
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let count = 0;
        let skipped = 0;
        let totalCharged = 0;
        for (const group of groups) {
            const price = Number(group.course?.price || 0);
            if (price <= 0 || !group.students)
                continue;
            const marker = `[oylik:${group.id}:${period}]`;
            const comment = `${group.name} guruhi uchun oylik to'lov yechildi ${marker}`;
            for (const item of group.students) {
                const student = item.student;
                if (!student || student.status !== 'active')
                    continue;
                const already = await this.prisma.payment.findFirst({
                    where: {
                        studentId: student.id,
                        amount: { lt: 0 },
                        paidAt: { gte: monthStart, lt: monthEnd },
                        OR: [
                            { comment: { contains: marker } },
                            { comment: `${group.name} guruhi uchun oylik to'lov yechildi` },
                        ],
                    },
                    select: { id: true },
                });
                if (already) {
                    skipped++;
                    continue;
                }
                const [updatedStudent] = await this.prisma.$transaction([
                    this.prisma.student.update({
                        where: { id: student.id },
                        data: {
                            balance: {
                                decrement: price,
                            },
                        },
                    }),
                    this.prisma.payment.create({
                        data: {
                            studentId: student.id,
                            amount: -price,
                            paymentMethod: client_1.PaymentType.cash,
                            comment,
                        },
                    }),
                ]);
                if (Number(updatedStudent.balance) < 0 && student.parentChatId) {
                    this.telegramService
                        .sendDebtAlert(student.parentChatId, student.fullName, Number(updatedStudent.balance), group.name)
                        .catch((e) => this.logger.error(`Telegram qarzdorlik xabari xatosi: ${e.message}`));
                }
                if (Number(updatedStudent.balance) < 0 && student.parentPhone) {
                    this.smsService
                        .sendDebtAlert(student.parentPhone, student.fullName, Number(updatedStudent.balance), group.name)
                        .catch((e) => this.logger.error(`SMS qarzdorlik xabari xatosi: ${e.message}`));
                }
                count++;
                totalCharged += price;
            }
        }
        return {
            success: true,
            count,
            skipped,
            totalCharged,
            message: `${count} ta o'quvchidan jami ${totalCharged.toLocaleString()} so'm oylik to'lov yechildi` +
                (skipped > 0 ? ` (${skipped} ta o'quvchidan bu oy uchun avval yechilgan — o'tkazib yuborildi)` : ''),
        };
    }
    async findAll(studentId, centerId) {
        return this.prisma.payment.findMany({
            where: {
                ...(studentId ? { studentId } : {}),
                ...(centerId ? { student: { centerId } } : {}),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
            },
            orderBy: { paidAt: 'desc' },
        });
    }
    async findOne(id) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                student: true,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('To\'lov topilmadi');
        }
        return payment;
    }
    verifyClickSign(data, isComplete) {
        const secret = this.configService.get('CLICK_SECRET_KEY');
        if (!secret) {
            this.logger.warn('Click webhook rad etildi: CLICK_SECRET_KEY sozlanmagan');
            return false;
        }
        const serviceId = this.configService.get('CLICK_SERVICE_ID');
        if (serviceId && String(data?.service_id) !== String(serviceId))
            return false;
        const expected = this.md5(`${data?.click_trans_id}${data?.service_id}${secret}${data?.merchant_trans_id}` +
            (isComplete ? `${data?.merchant_prepare_id}` : '') +
            `${data?.amount}${data?.action}${data?.sign_time}`);
        return this.safeEqual(expected, data?.sign_string);
    }
    clickError(data, error, note) {
        return {
            click_trans_id: data?.click_trans_id,
            merchant_trans_id: data?.merchant_trans_id,
            error,
            error_note: note,
        };
    }
    async clickPrepare(data) {
        if (!this.verifyClickSign(data, false)) {
            return this.clickError(data, -1, 'SIGN CHECK FAILED!');
        }
        const amount = Number(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return this.clickError(data, -2, 'Incorrect parameter amount');
        }
        const student = await this.prisma.student.findUnique({
            where: { id: String(data.merchant_trans_id) },
        });
        if (!student) {
            this.logger.warn(`Click Prepare: O'quvchi topilmadi (ID: ${data.merchant_trans_id})`);
            return this.clickError(data, -5, "O'quvchi topilmadi");
        }
        return {
            click_trans_id: data.click_trans_id,
            merchant_trans_id: data.merchant_trans_id,
            merchant_prepare_id: Date.now(),
            error: 0,
            error_note: 'Success',
        };
    }
    async clickComplete(data) {
        if (!this.verifyClickSign(data, true)) {
            return this.clickError(data, -1, 'SIGN CHECK FAILED!');
        }
        if (data.error && Number(data.error) < 0) {
            return this.clickError(data, -9, 'Bekor qilingan');
        }
        const amount = Number(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return this.clickError(data, -2, 'Incorrect parameter amount');
        }
        const student = await this.prisma.student.findUnique({
            where: { id: String(data.merchant_trans_id) },
        });
        if (!student) {
            return this.clickError(data, -5, "O'quvchi topilmadi");
        }
        const ref = `click-${data.click_trans_id}`;
        const duplicate = await this.findByExternalRef(student.id, ref);
        if (duplicate) {
            return this.clickError(data, -4, 'Already paid');
        }
        try {
            await this.create({
                studentId: student.id,
                amount,
                paymentMethod: 'click',
                comment: `Click orqali to'lov (Tr: ${ref})`,
            });
            this.logger.log(`Click Complete: ${student.fullName} balansiga ${amount} so'm qo'shildi.`);
            return {
                click_trans_id: data.click_trans_id,
                merchant_trans_id: data.merchant_trans_id,
                merchant_confirm_id: Date.now(),
                error: 0,
                error_note: 'Success',
            };
        }
        catch (err) {
            this.logger.error(`Click Complete Error: ${err.message}`);
            return this.clickError(data, -7, 'Failed to update user');
        }
    }
    async createAtmosInvoice(studentId, amount) {
        if (!studentId || !Number.isFinite(amount) || amount < 1000) {
            throw new common_1.BadRequestException("O'quvchi va to'lov summasi (kamida 1 000 so'm) kiritilishi shart");
        }
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException("O'quvchi topilmadi");
        }
        const consumerKey = this.configService.get('ATMOS_CONSUMER_KEY');
        const consumerSecret = this.configService.get('ATMOS_CONSUMER_SECRET');
        const storeId = this.configService.get('ATMOS_STORE_ID');
        const portalUrl = this.configService.get('WEB_APP_URL') || 'https://eduyuz.uz';
        if (!consumerKey || !consumerSecret || !storeId) {
            throw new common_1.ServiceUnavailableException("Onlayn to'lov (Atmos) hali ulanmagan");
        }
        try {
            const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
            const tokenRes = await fetch('https://apigw.atmos.uz/token', {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials',
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData?.access_token) {
                throw new Error('Atmos token olinmadi');
            }
            const invoiceRes = await fetch('https://apigw.atmos.uz/checkout/invoice/create', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    request_id: Date.now().toString(),
                    store_id: Number(storeId),
                    account: studentId,
                    amount: Math.round(amount * 100),
                    success_url: `${portalUrl}/portal?studentId=${studentId}`,
                    items: [
                        {
                            items_id: '1',
                            name: "O'quv kursi to'lovi",
                            amount: Math.round(amount * 100),
                            details: [],
                        },
                    ],
                }),
            });
            const invoiceData = await invoiceRes.json();
            if (!invoiceRes.ok || !invoiceData?.url) {
                throw new Error('Atmos invoys yaratilmadi');
            }
            this.logger.log(`Atmos orqali invoys yaratildi: ${amount} so'm (${student.fullName})`);
            return { url: invoiceData.url };
        }
        catch (err) {
            this.logger.error(`Atmos Invoice Error: ${err.message}`);
            throw new common_1.ServiceUnavailableException("Atmos xizmatiga ulanib bo'lmadi");
        }
    }
    async atmosCallback(data, signature) {
        const apiKey = this.configService.get('ATMOS_API_KEY');
        if (!apiKey) {
            this.logger.warn('Atmos callback rad etildi: ATMOS_API_KEY sozlanmagan');
            return { status: 0, message: "To'lov tizimi sozlanmagan" };
        }
        const expectedSign = this.md5(`${data?.store_id}${data?.transaction_id}${data?.invoice}${data?.amount}${apiKey}`);
        if (!this.safeEqual(expectedSign, signature)) {
            this.logger.warn(`Atmos callback: imzo xato (Tr: ${data?.transaction_id})`);
            return { status: 0, message: 'Imzo xato' };
        }
        const amount = Number(data.amount) / 100;
        if (!Number.isFinite(amount) || amount <= 0) {
            return { status: 0, message: "Summa noto'g'ri" };
        }
        const student = await this.prisma.student.findUnique({
            where: { id: String(data.account || data.invoice) },
        });
        if (!student) {
            return { status: 0, message: "O'quvchi topilmadi" };
        }
        const ref = `atmos-${data.transaction_id}`;
        if (await this.findByExternalRef(student.id, ref)) {
            return { status: 1, message: 'Muvaffaqiyatli' };
        }
        await this.create({
            studentId: student.id,
            amount,
            paymentMethod: 'card',
            comment: `Atmos/Paynet orqali to'lov (Tr: ${ref})`,
        });
        this.logger.log(`Atmos Callback: ${student.fullName} balansiga ${amount} so'm qo'shildi.`);
        return {
            status: 1,
            message: 'Muvaffaqiyatli',
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService,
        sms_service_1.SmsService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map