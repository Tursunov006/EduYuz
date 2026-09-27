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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let SmsService = SmsService_1 = class SmsService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(SmsService_1.name);
        this.eskizToken = null;
        this.tokenExpiresAt = 0;
    }
    cleanPhone(phone) {
        let clean = phone.replace(/\D/g, '');
        if (clean.length === 9) {
            clean = '998' + clean;
        }
        return clean;
    }
    async getEskizToken() {
        const email = this.configService.get('ESKIZ_EMAIL');
        const password = this.configService.get('ESKIZ_PASSWORD');
        if (!email || !password || email === 'info@eduyuz.uz') {
            return null;
        }
        if (this.eskizToken && Date.now() < this.tokenExpiresAt) {
            return this.eskizToken;
        }
        try {
            const res = await fetch('https://notify.eskiz.uz/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok)
                return null;
            const data = await res.json();
            if (data?.data?.token) {
                this.eskizToken = data.data.token;
                this.tokenExpiresAt = Date.now() + 25 * 24 * 3600 * 1000;
                return this.eskizToken;
            }
        }
        catch (err) {
            this.logger.error(`Eskiz auth xatosi: ${err.message}`);
        }
        return null;
    }
    async sendSms(phone, message) {
        const cleanPhone = this.cleanPhone(phone);
        const token = await this.getEskizToken();
        const from = this.configService.get('ESKIZ_FROM') || '4546';
        let status = 'sent';
        if (token) {
            try {
                const formData = new URLSearchParams();
                formData.append('mobile_phone', cleanPhone);
                formData.append('message', message);
                formData.append('from', from);
                const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });
                if (!res.ok) {
                    status = 'failed';
                    this.logger.warn(`Eskiz SMS yuborishda xatolik: ${res.statusText}`);
                }
            }
            catch (err) {
                status = 'failed';
                this.logger.error(`Eskiz tarmoq xatosi: ${err.message}`);
            }
        }
        else {
            this.logger.log(`📱 [SMS Demo Gateway] ${cleanPhone} raqamiga xabar: "${message}"`);
            status = 'demo';
        }
        await this.prisma.smsLog.create({
            data: {
                phone: cleanPhone,
                message,
                status,
            },
        });
        return { success: status !== 'failed', status };
    }
    async sendAttendanceAlert(parentPhone, studentName, groupName) {
        if (!parentPhone)
            return;
        const msg = `EduYuz: Hurmatli ota-ona! Farzandingiz ${studentName} bugun ${groupName} darsiga qatnashmadi.`;
        return this.sendSms(parentPhone, msg);
    }
    async sendPaymentReceipt(parentPhone, studentName, amount, newBalance) {
        if (!parentPhone)
            return;
        const msg = `EduYuz: Farzandingiz ${studentName} uchun ${amount.toLocaleString()} so'm to'lov qabul qilindi. Joriy balans: ${newBalance.toLocaleString()} so'm.`;
        return this.sendSms(parentPhone, msg);
    }
    async sendDebtAlert(parentPhone, studentName, debtAmount, groupName) {
        if (!parentPhone)
            return;
        const msg = `EduYuz Eslatma: Farzandingiz ${studentName}ning ${groupName} darsi uchun ${Math.abs(debtAmount).toLocaleString()} so'm qarzdorligi mavjud. Iltimos to'lovni amalga oshiring.`;
        return this.sendSms(parentPhone, msg);
    }
    async getLogs() {
        return this.prisma.smsLog.findMany({
            orderBy: { sentAt: 'desc' },
            take: 100,
        });
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], SmsService);
//# sourceMappingURL=sms.service.js.map