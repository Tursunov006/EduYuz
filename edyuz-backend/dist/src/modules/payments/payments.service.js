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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService,
        sms_service_1.SmsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map