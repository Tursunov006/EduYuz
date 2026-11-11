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
exports.TeachersService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
const TEACHER_SAFE_SELECT = {
    id: true,
    centerId: true,
    fullName: true,
    phone: true,
    role: true,
    specialty: true,
    salaryType: true,
    salaryRate: true,
    isActive: true,
    createdAt: true,
};
function generateTempPassword(length = 10) {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < length; i++)
        out += alphabet[(0, crypto_1.randomInt)(alphabet.length)];
    return out;
}
let TeachersService = class TeachersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(centerId) {
        const currentPeriod = new Date().toISOString().slice(0, 7);
        const where = { role: 'teacher' };
        if (centerId) {
            where.centerId = centerId;
        }
        const teachers = await this.prisma.user.findMany({
            where,
            include: {
                groups: {
                    include: {
                        course: true,
                        students: {
                            include: {
                                student: true,
                            },
                        },
                    },
                },
                salaryPayments: {
                    orderBy: { paidAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return teachers.map((teacher) => {
            let totalStudentsCount = 0;
            let monthlyGrossRevenue = 0;
            const groupSummaries = teacher.groups.map((g) => {
                const studentCount = g.students.length;
                totalStudentsCount += studentCount;
                const groupRevenue = studentCount * Number(g.course?.price || 0);
                monthlyGrossRevenue += groupRevenue;
                return {
                    id: g.id,
                    name: g.name,
                    courseTitle: g.course?.title,
                    coursePrice: Number(g.course?.price || 0),
                    studentCount,
                    days: g.days,
                    time: g.startTime + ' - ' + g.endTime,
                };
            });
            const salaryRate = Number(teacher.salaryRate || 0);
            let expectedMonthlySalary = 0;
            if (teacher.salaryType === 'percentage') {
                expectedMonthlySalary = Math.round(monthlyGrossRevenue * (salaryRate / 100));
            }
            else {
                expectedMonthlySalary = salaryRate;
            }
            const currentMonthPaid = teacher.salaryPayments
                .filter((sp) => sp.periodMonth === currentPeriod)
                .reduce((sum, sp) => sum + Number(sp.amount), 0);
            const remainingSalary = Math.max(0, expectedMonthlySalary - currentMonthPaid);
            return {
                id: teacher.id,
                centerId: teacher.centerId,
                fullName: teacher.fullName,
                phone: teacher.phone,
                specialty: teacher.specialty || 'Asosiy ustoz',
                salaryType: teacher.salaryType,
                salaryRate,
                isActive: teacher.isActive,
                createdAt: teacher.createdAt,
                groups: groupSummaries,
                totalGroups: teacher.groups.length,
                totalStudents: totalStudentsCount,
                monthlyGrossRevenue,
                expectedMonthlySalary,
                currentMonthPaid,
                remainingSalary,
                currentPeriod,
                recentPayments: teacher.salaryPayments.slice(0, 5),
            };
        });
    }
    async findOne(id) {
        const teacher = await this.prisma.user.findUnique({
            where: { id },
            include: {
                groups: {
                    include: {
                        course: true,
                        students: {
                            include: {
                                student: true,
                            },
                        },
                    },
                },
                salaryPayments: {
                    orderBy: { paidAt: 'desc' },
                },
            },
        });
        if (!teacher || teacher.role !== 'teacher') {
            throw new common_1.NotFoundException("O'qituvchi topilmadi");
        }
        const { passwordHash, ...safe } = teacher;
        return safe;
    }
    async getTeacherOrThrow(id) {
        const teacher = await this.prisma.user.findUnique({ where: { id } });
        if (!teacher || teacher.role !== 'teacher') {
            throw new common_1.NotFoundException("O'qituvchi topilmadi");
        }
        return teacher;
    }
    async create(dto) {
        const centerId = dto.centerId;
        if (!centerId) {
            throw new common_1.NotFoundException('Tizimda o\'quv markazi topilmadi');
        }
        const existing = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
        });
        if (existing) {
            throw new common_1.ConflictException("Ushbu telefon raqam bilan foydalanuvchi ro'yxatdan o'tgan");
        }
        if ((dto.salaryType || 'percentage') === 'percentage' && (dto.salaryRate ?? 50) > 100) {
            throw new common_1.BadRequestException("Foiz stavkasi 100% dan oshmasligi kerak");
        }
        const generated = dto.password ? null : generateTempPassword();
        const passwordHash = await bcrypt.hash(dto.password || generated, 10);
        const created = await this.prisma.user.create({
            data: {
                centerId,
                fullName: dto.fullName,
                phone: dto.phone,
                passwordHash,
                role: 'teacher',
                specialty: dto.specialty || 'Ustoz',
                salaryType: dto.salaryType || 'percentage',
                salaryRate: dto.salaryRate !== undefined ? dto.salaryRate : 50.0,
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                specialty: true,
                salaryType: true,
                salaryRate: true,
                createdAt: true,
            },
        });
        return { ...created, temporaryPassword: generated };
    }
    async update(id, dto) {
        const teacher = await this.getTeacherOrThrow(id);
        if (dto.phone !== undefined && dto.phone !== teacher.phone) {
            const taken = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
            if (taken) {
                throw new common_1.ConflictException("Ushbu telefon raqam bilan foydalanuvchi ro'yxatdan o'tgan");
            }
        }
        const data = {};
        if (dto.fullName !== undefined)
            data.fullName = dto.fullName;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        if (dto.specialty !== undefined)
            data.specialty = dto.specialty;
        if (dto.salaryType !== undefined)
            data.salaryType = dto.salaryType;
        if (dto.salaryRate !== undefined)
            data.salaryRate = dto.salaryRate;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        const effectiveType = dto.salaryType ?? teacher.salaryType;
        const effectiveRate = dto.salaryRate ?? Number(teacher.salaryRate);
        if (effectiveType === 'percentage' && effectiveRate > 100) {
            throw new common_1.BadRequestException("Foiz stavkasi 100% dan oshmasligi kerak");
        }
        if (dto.password) {
            data.passwordHash = await bcrypt.hash(dto.password, 10);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: TEACHER_SAFE_SELECT,
        });
    }
    async delete(id) {
        await this.getTeacherOrThrow(id);
        const groupCount = await this.prisma.group.count({ where: { teacherId: id } });
        if (groupCount > 0) {
            throw new common_1.ConflictException(`Bu o'qituvchiga ${groupCount} ta guruh biriktirilgan. Avval guruhlarni boshqa o'qituvchiga o'tkazing.`);
        }
        return this.prisma.user.delete({ where: { id }, select: TEACHER_SAFE_SELECT });
    }
    async paySalary(teacherId, dto) {
        await this.getTeacherOrThrow(teacherId);
        return this.prisma.salaryPayment.create({
            data: {
                teacherId,
                amount: dto.amount,
                periodMonth: dto.periodMonth,
                paymentMethod: dto.paymentMethod || 'cash',
                comment: dto.comment,
            },
        });
    }
    async getSalaryHistory(teacherId) {
        return this.prisma.salaryPayment.findMany({
            where: { teacherId },
            orderBy: { paidAt: 'desc' },
        });
    }
};
exports.TeachersService = TeachersService;
exports.TeachersService = TeachersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeachersService);
//# sourceMappingURL=teachers.service.js.map