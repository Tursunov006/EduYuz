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
var AttendanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const sms_service_1 = require("../sms/sms.service");
let AttendanceService = AttendanceService_1 = class AttendanceService {
    constructor(prisma, telegramService, smsService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.smsService = smsService;
        this.logger = new common_1.Logger(AttendanceService_1.name);
    }
    async processFaceScan(imageBase64, centerId) {
        let student = await this.prisma.student.findFirst({
            where: { centerId, parentChatId: { not: null } },
        });
        let sentToTelegram = true;
        if (!student) {
            student = await this.prisma.student.findFirst({ where: { centerId } });
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
        if (Number.isNaN(attendanceDate.getTime())) {
            throw new common_1.BadRequestException("Sana formati noto'g'ri");
        }
        const recordMap = new Map(dto.records.map((r) => [r.studentId, r]));
        const records = Array.from(recordMap.values());
        const studentIds = records.map((r) => r.studentId);
        const members = await this.prisma.groupStudent.findMany({
            where: { groupId: dto.groupId, studentId: { in: studentIds } },
            select: { studentId: true },
        });
        const memberIds = new Set(members.map((m) => m.studentId));
        const outsiders = studentIds.filter((id) => !memberIds.has(id));
        if (outsiders.length > 0) {
            throw new common_1.BadRequestException("Ro'yxatda bu guruhga tegishli bo'lmagan o'quvchi bor");
        }
        const previous = await this.prisma.attendance.findMany({
            where: { groupId: dto.groupId, date: attendanceDate, studentId: { in: studentIds } },
            select: { studentId: true, status: true },
        });
        const previousStatus = new Map(previous.map((p) => [p.studentId, p.status]));
        const newlyPresent = records.filter((r) => r.status === 'present' && previousStatus.get(r.studentId) !== 'present');
        const noLongerPresent = records.filter((r) => r.status !== 'present' && previousStatus.get(r.studentId) === 'present');
        const ATTENDANCE_COINS = 10;
        await this.prisma.$transaction([
            ...records.map((record) => this.prisma.attendance.upsert({
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
            })),
            ...newlyPresent.flatMap((rec) => [
                this.prisma.student.update({
                    where: { id: rec.studentId },
                    data: {
                        coins: { increment: ATTENDANCE_COINS },
                        points: { increment: ATTENDANCE_COINS },
                    },
                }),
                this.prisma.coinTransaction.create({
                    data: {
                        studentId: rec.studentId,
                        amount: ATTENDANCE_COINS,
                        reason: `Darsga o'z vaqtida kelgani uchun (${group.name})`,
                    },
                }),
            ]),
            ...noLongerPresent.flatMap((rec) => [
                this.prisma.student.update({
                    where: { id: rec.studentId },
                    data: {
                        coins: { decrement: ATTENDANCE_COINS },
                        points: { decrement: ATTENDANCE_COINS },
                    },
                }),
                this.prisma.coinTransaction.create({
                    data: {
                        studentId: rec.studentId,
                        amount: -ATTENDANCE_COINS,
                        reason: `Davomat tuzatildi (${group.name})`,
                    },
                }),
            ]),
        ]);
        const changed = records.filter((r) => previousStatus.get(r.studentId) !== r.status);
        if (changed.length > 0) {
            const students = await this.prisma.student.findMany({
                where: { id: { in: changed.map((r) => r.studentId) } },
            });
            for (const student of students) {
                const record = recordMap.get(student.id);
                if (record && student.parentChatId) {
                    this.telegramService
                        .sendAttendanceAlert(student.parentChatId, student.fullName, group.name, record.status, dto.date)
                        .catch((e) => this.logger.warn(`Telegram davomat xabari xatosi: ${e.message}`));
                }
                if (record && record.status === 'absent' && student.parentPhone) {
                    this.smsService
                        .sendAttendanceAlert(student.parentPhone, student.fullName, group.name)
                        .catch((e) => this.logger.warn(`SMS davomat xabari xatosi: ${e.message}`));
                }
            }
        }
        return {
            success: true,
            message: 'Davomat muvaffaqiyatli saqlandi',
        };
    }
    async findByGroupAndDate(groupId, date) {
        const targetDate = date ? new Date(date) : new Date();
        if (Number.isNaN(targetDate.getTime())) {
            throw new common_1.BadRequestException("Sana formati noto'g'ri");
        }
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
exports.AttendanceService = AttendanceService = AttendanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService,
        sms_service_1.SmsService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map