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
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const telegram_service_1 = require("../telegram/telegram.service");
const sms_service_1 = require("../sms/sms.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, telegramService, smsService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.smsService = smsService;
        this.logger = new common_1.Logger(PaymentsService_1.name);
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
                .catch(() => { });
        }
        if (student.parentPhone) {
            this.smsService
                .sendPaymentReceipt(student.parentPhone, student.fullName, dto.amount, result.newBalance)
                .catch((e) => this.logger.error(`SMS to'lov cheki xatosi: ${e.message}`));
        }
        return result.payment;
    }
    async chargeMonthly(groupId) {
        const groups = await this.prisma.group.findMany({
            where: groupId ? { id: groupId } : {},
            include: {
                course: true,
                students: {
                    include: {
                        student: true,
                    },
                },
            },
        });
        let count = 0;
        let totalCharged = 0;
        for (const group of groups) {
            const price = Number(group.course?.price || 0);
            if (price <= 0 || !group.students)
                continue;
            for (const item of group.students) {
                const student = item.student;
                if (!student || student.status !== 'active')
                    continue;
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
                            comment: `${group.name} guruhi uchun oylik to'lov yechildi`,
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
            totalCharged,
            message: `${count} ta o'quvchidan jami ${totalCharged.toLocaleString()} so'm oylik to'lov yechildi`,
        };
    }
    async findAll(studentId) {
        return this.prisma.payment.findMany({
            where: studentId ? { studentId } : {},
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
    async clickPrepare(data) {
        const student = await this.prisma.student.findUnique({
            where: { id: data.merchant_trans_id }
        });
        if (!student) {
            this.logger.warn(`Click Prepare: O'quvchi topilmadi (ID: ${data.merchant_trans_id})`);
            return {
                click_trans_id: data.click_trans_id,
                merchant_trans_id: data.merchant_trans_id,
                error: -5,
                error_note: "O'quvchi topilmadi"
            };
        }
        return {
            click_trans_id: data.click_trans_id,
            merchant_trans_id: data.merchant_trans_id,
            merchant_prepare_id: Date.now(),
            error: 0,
            error_note: "Success"
        };
    }
    async clickComplete(data) {
        if (data.error && Number(data.error) < 0) {
            return {
                click_trans_id: data.click_trans_id,
                merchant_trans_id: data.merchant_trans_id,
                error: -9,
                error_note: "Bekor qilingan"
            };
        }
        const student = await this.prisma.student.findUnique({
            where: { id: data.merchant_trans_id }
        });
        if (!student) {
            return {
                click_trans_id: data.click_trans_id,
                merchant_trans_id: data.merchant_trans_id,
                error: -5,
                error_note: "O'quvchi topilmadi"
            };
        }
        try {
            await this.create({
                studentId: data.merchant_trans_id,
                amount: Number(data.amount),
                paymentMethod: 'click',
                comment: `Click orqali to'lov (Tr: ${data.click_trans_id})`
            });
            this.logger.log(`Click Complete: ${student.fullName} balansiga ${data.amount} so'm qo'shildi.`);
            return {
                click_trans_id: data.click_trans_id,
                merchant_trans_id: data.merchant_trans_id,
                merchant_confirm_id: Date.now(),
                error: 0,
                error_note: "Success"
            };
        }
        catch (err) {
            this.logger.error(`Click Complete Error: ${err.message}`);
            return {
                click_trans_id: data.click_trans_id,
                merchant_trans_id: data.merchant_trans_id,
                error: -4,
                error_note: "Xatolik yuz berdi"
            };
        }
    }
    async createAtmosInvoice(studentId, amount) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId }
        });
        if (!student) {
            throw new common_1.NotFoundException("O'quvchi topilmadi");
        }
        try {
            const consumerKey = 'test_consumer_key';
            const consumerSecret = 'test_consumer_secret';
            const storeId = 1234;
            const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
            this.logger.log(`Atmos (Paynet) orqali invoys yaratildi: ${amount} so'm (${student.fullName})`);
            return {
                url: `https://test-checkout.pays.uz/invoice/get?storeId=${storeId}&transactionId=${Date.now()}&redirectLink=https://eduyuz.uz/portal`
            };
        }
        catch (err) {
            this.logger.error(`Atmos Invoice Error: ${err.message}`);
            throw new Error("Atmos xizmatiga ulanib bo'lmadi");
        }
    }
    async atmosCallback(data, signature) {
        const apiKey = 'test_api_key';
        const crypto = require('crypto');
        const hashString = `${data.store_id}${data.transaction_id}${data.invoice}${data.amount}${apiKey}`;
        const expectedSign = crypto.createHash('md5').update(hashString).digest('hex');
        const student = await this.prisma.student.findUnique({
            where: { id: String(data.account || data.invoice) }
        });
        if (!student) {
            return { status: 0, message: "O'quvchi topilmadi" };
        }
        await this.create({
            studentId: student.id,
            amount: Number(data.amount) / 100,
            paymentMethod: 'click',
            comment: `Atmos/Paynet orqali to'lov (Tr: ${data.transaction_id})`
        });
        this.logger.log(`Atmos Callback: ${student.fullName} balansiga ${data.amount / 100} so'm qo'shildi.`);
        return {
            status: 1,
            message: "Muvaffaqiyatli"
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService,
        sms_service_1.SmsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map