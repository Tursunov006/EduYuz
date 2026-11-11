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
exports.CentersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
function generateTempPassword(length = 10) {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < length; i++)
        out += alphabet[(0, crypto_1.randomInt)(alphabet.length)];
    return out;
}
let CentersService = class CentersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const center = await this.prisma.center.create({
            data: {
                name: dto.name.trim(),
                phone: dto.phone.trim(),
                trialEndsAt,
                subscriptionStatus: 'trial',
            },
        });
        const phone = dto.phone.trim();
        const existingUser = await this.prisma.user.findUnique({ where: { phone } });
        let directorPassword = null;
        if (!existingUser) {
            directorPassword = generateTempPassword();
            await this.prisma.user.create({
                data: {
                    centerId: center.id,
                    fullName: `${dto.name} Rahbari`,
                    phone,
                    passwordHash: await bcrypt.hash(directorPassword, 10),
                    role: client_1.RoleType.admin,
                    isActive: true,
                },
            });
        }
        return {
            ...center,
            directorLogin: existingUser ? null : phone,
            directorPassword,
            directorNote: existingUser
                ? 'Bu telefon raqam boshqa hisobga biriktirilgan — direktor hisobi yaratilmadi'
                : null,
        };
    }
    async findAll(onlyCenterId) {
        return this.prisma.center.findMany({
            where: onlyCenterId ? { id: onlyCenterId } : {},
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        users: true,
                        courses: true,
                        groups: true,
                        students: true,
                    },
                },
            },
        });
    }
    async findOne(id) {
        const center = await this.prisma.center.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        courses: true,
                        groups: true,
                        students: true,
                    },
                },
            },
        });
        if (!center) {
            throw new common_1.NotFoundException('Markaz topilmadi');
        }
        return center;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.center.update({
            where: { id },
            data: dto,
        });
    }
    async updateStatus(id, status, daysToAdd = 30) {
        await this.findOne(id);
        const safeDays = Number.isFinite(Number(daysToAdd)) ? Number(daysToAdd) : 30;
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + safeDays);
        const updated = await this.prisma.center.update({
            where: { id },
            data: {
                subscriptionStatus: status,
                trialEndsAt: status === 'expired' ? new Date(0) : trialEndsAt,
            },
        });
        await this.prisma.user.updateMany({
            where: { centerId: id, role: { not: client_1.RoleType.superadmin } },
            data: { isActive: status !== 'expired' },
        });
        return updated;
    }
    async resetDirectorPassword(id, requestedPassword) {
        const center = await this.findOne(id);
        const newPassword = requestedPassword?.trim() || generateTempPassword();
        const passwordHash = await bcrypt.hash(newPassword, 10);
        const user = (await this.prisma.user.findFirst({
            where: { centerId: id, phone: center.phone, role: client_1.RoleType.admin },
        })) ||
            (await this.prisma.user.findFirst({
                where: { centerId: id, role: client_1.RoleType.admin },
                orderBy: { createdAt: 'asc' },
            }));
        let login = center.phone;
        if (user) {
            login = user.phone;
            await this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash, isActive: true },
            });
        }
        else {
            const phoneTaken = await this.prisma.user.findUnique({ where: { phone: center.phone } });
            if (phoneTaken) {
                throw new common_1.ConflictException('Markaz telefoni boshqa hisobga biriktirilgan — direktor hisobini yaratib bo\'lmadi');
            }
            await this.prisma.user.create({
                data: {
                    centerId: id,
                    fullName: `${center.name} Rahbari`,
                    phone: center.phone,
                    passwordHash,
                    role: client_1.RoleType.admin,
                    isActive: true,
                },
            });
        }
        return {
            success: true,
            login,
            password: newPassword,
            message: 'Direktor paroli muvaffaqiyatli yangilandi!',
        };
    }
    async remove(id) {
        await this.findOne(id);
        const [, , deleted] = await this.prisma.$transaction([
            this.prisma.payment.deleteMany({ where: { student: { centerId: id } } }),
            this.prisma.group.deleteMany({ where: { centerId: id } }),
            this.prisma.center.delete({ where: { id } }),
        ]);
        return deleted;
    }
};
exports.CentersService = CentersService;
exports.CentersService = CentersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CentersService);
//# sourceMappingURL=centers.service.js.map