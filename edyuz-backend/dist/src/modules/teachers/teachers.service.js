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
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
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
        return teacher;
    }
    async create(dto) {
        let centerId = dto.centerId;
        if (!centerId) {
            const firstCenter = await this.prisma.center.findFirst();
            if (!firstCenter) {
                throw new common_1.NotFoundException('Tizimda o\'quv markazi topilmadi');
            }
            centerId = firstCenter.id;
        }
        const existing = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
        });
        if (existing) {
            throw new common_1.ConflictException("Ushbu telefon raqam bilan foydalanuvchi ro'yxatdan o'tgan");
        }
        const rawPassword = dto.password || 'teacher123';
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        return this.prisma.user.create({
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
    }
    async update(id, dto) {
        const teacher = await this.prisma.user.findUnique({ where: { id } });
        if (!teacher) {
            throw new common_1.NotFoundException("O'qituvchi topilmadi");
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
        if (dto.password) {
            data.passwordHash = await bcrypt.hash(dto.password, 10);
        }
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        const teacher = await this.prisma.user.findUnique({ where: { id } });
        if (!teacher) {
            throw new common_1.NotFoundException("O'qituvchi topilmadi");
        }
        return this.prisma.user.delete({ where: { id } });
    }
    async paySalary(teacherId, dto) {
        const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
        if (!teacher) {
            throw new common_1.NotFoundException("O'qituvchi topilmadi");
        }
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