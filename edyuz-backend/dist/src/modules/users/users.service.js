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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const center = await this.prisma.center.findUnique({
            where: { id: dto.centerId },
        });
        if (!center) {
            throw new common_1.NotFoundException('Ko\'rsatilgan markaz topilmadi');
        }
        const existing = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
        });
        if (existing) {
            throw new common_1.ConflictException('Ushbu telefon raqamli foydalanuvchi allaqachon mavjud');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        return this.prisma.user.create({
            data: {
                centerId: dto.centerId,
                fullName: dto.fullName,
                phone: dto.phone,
                passwordHash,
                role: dto.role,
                isActive: dto.isActive,
            },
            select: {
                id: true,
                centerId: true,
                fullName: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
    }
    async findAll(centerId) {
        return this.prisma.user.findMany({
            where: centerId ? { centerId } : {},
            select: {
                id: true,
                centerId: true,
                fullName: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                centerId: true,
                fullName: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Foydalanuvchi topilmadi');
        }
        return user;
    }
    async update(id, dto) {
        await this.findOne(id);
        const dataToUpdate = {
            fullName: dto.fullName,
            phone: dto.phone,
            role: dto.role,
            isActive: dto.isActive,
        };
        if (dto.password) {
            dataToUpdate.passwordHash = await bcrypt.hash(dto.password, 10);
        }
        return this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                centerId: true,
                fullName: true,
                phone: true,
                role: true,
                isActive: true,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.user.delete({
            where: { id },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map