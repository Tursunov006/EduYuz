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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const sms_service_1 = require("../sms/sms.service");
let AttendanceService = class AttendanceService {
    constructor(prisma, telegramService, smsService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.smsService = smsService;
    }
    async processFaceScan(imageBase64) {
        let student = await this.prisma.student.findFirst({
            where: { parentChatId: { not: null } },
        });
        let sentToTelegram = true;
        if (!student) {
            student = await this.prisma.student.findFirst();
            sentToTelegram = false;
        }
        if (!student) {
            return {
                success: true,
                message: "Davomat tasdiqlandi (Lekin bazada o'quvchi yo'q edi)",
                name: "Test O'quvchi"
            };
        }
        if (sentToTelegram) {
            const caption = `📸 <b>Face-ID Davomat tizimi</b>\n\n✅ <b>${student.fullName}</b> o'quv markaziga yetib keldi!\n🕒 Vaqt: ${new Date().toLocaleTimeString('uz-UZ')}`;
            await this.telegramService.sendPhotoBase64(student.parentChatId, imageBase64, caption).catch(() => { });
        }
        return {
            success: true,
            message: sentToTelegram ? "Telegram orqali ota-onasiga rasm yuborildi!" : "Davomatga belgilandi!",
            name: student.fullName
        };
    }
    async markGroupAttendance(dto, userId) {
        const group = await this.prisma.group.findUnique({
            where: { id: dto.groupId },
        });
        if (!group) {
            throw new common_1.NotFoundException('Guruh topilmadi');
        }
        const attendanceDate = new Date(dto.date);
        const operations = dto.records.map((record) => this.prisma.attendance.upsert({
            where: {
                groupId_studentId_date: {
                    groupId: dto.groupId,
                    studentId: record.studentId,
                    date: attendanceDate,
                },
            },
            update: {
                status: record.status,
                markedBy: userId,
            },
            create: {
                groupId: dto.groupId,
                studentId: record.studentId,
                date: attendanceDate,
                status: record.status,
                markedBy: userId,
            },
        }));
        await this.prisma.$transaction(operations);
        const presentRecords = dto.records.filter((r) => r.status === 'present');
        for (const rec of presentRecords) {
            this.prisma.student
                .update({
                where: { id: rec.studentId },
                data: { coins: { increment: 10 }, points: { increment: 10 } },
            })
                .catch(() => { });
            this.prisma.coinTransaction
                .create({
                data: {
                    studentId: rec.studentId,
                    amount: 10,
                    reason: `Darsga o'z vaqtida kelgani uchun (${group.name})`,
                },
            })
                .catch(() => { });
        }
        const absentOrLateRecords = dto.records.filter((r) => r.status === 'absent' || r.status === 'late');
        if (absentOrLateRecords.length > 0) {
            const studentIds = absentOrLateRecords.map((r) => r.studentId);
            const students = await this.prisma.student.findMany({
                where: { id: { in: studentIds } },
            });
            for (const student of students) {
                const record = absentOrLateRecords.find((r) => r.studentId === student.id);
                if (record && student.parentChatId) {
                    this.telegramService
                        .sendAttendanceAlert(student.parentChatId, student.fullName, group.name, record.status, dto.date)
                        .catch(() => { });
                }
                if (record && record.status === 'absent' && student.parentPhone) {
                    this.smsService
                        .sendAttendanceAlert(student.parentPhone, student.fullName, group.name)
                        .catch(() => { });
                }
            }
        }
        return {
            success: true,
            message: 'Davomat muvaffaqiyatli saqlandi',
        };
    }
    async findByGroupAndDate(groupId, date) {
        const targetDate = new Date(date);
        return this.prisma.attendance.findMany({
            where: {
                groupId,
                date: targetDate,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
                marker: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
            },
        });
    }
    async getStudentAttendance(studentId) {
        return this.prisma.attendance.findMany({
            where: { studentId },
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService,
        sms_service_1.SmsService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map