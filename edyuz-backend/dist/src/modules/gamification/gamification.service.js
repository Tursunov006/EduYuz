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
exports.GamificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GamificationService = class GamificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLeaderboard(groupId) {
        const where = { status: 'active' };
        if (groupId) {
            where.groups = {
                some: { groupId },
            };
        }
        const students = await this.prisma.student.findMany({
            where,
            select: {
                id: true,
                fullName: true,
                coins: true,
                points: true,
                groups: {
                    include: {
                        group: {
                            select: {
                                name: true,
                                course: {
                                    select: { title: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { coins: 'desc' },
            take: 30,
        });
        return students.map((s, idx) => ({
            rank: idx + 1,
            id: s.id,
            fullName: s.fullName,
            coins: s.coins,
            points: s.points,
            groupName: s.groups[0]?.group?.name || 'Guruhsiz',
            courseTitle: s.groups[0]?.group?.course?.title || 'Umumiy kurs',
        }));
    }
    async awardCoins(dto) {
        const student = await this.prisma.student.findUnique({
            where: { id: dto.studentId },
        });
        if (!student)
            throw new common_1.NotFoundException('O\'quvchi topilmadi');
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.student.update({
                where: { id: dto.studentId },
                data: {
                    coins: {
                        increment: dto.amount,
                    },
                    points: dto.amount > 0 ? { increment: dto.amount } : undefined,
                },
            });
            await tx.coinTransaction.create({
                data: {
                    studentId: dto.studentId,
                    amount: dto.amount,
                    reason: dto.reason,
                },
            });
            return updated;
        });
    }
    async getStudentHistory(studentId) {
        return this.prisma.coinTransaction.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.GamificationService = GamificationService;
exports.GamificationService = GamificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GamificationService);
//# sourceMappingURL=gamification.service.js.map