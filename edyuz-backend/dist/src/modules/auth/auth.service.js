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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
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
            throw new common_1.ConflictException('Ushbu telefon raqam bilan ro\'yxatdan o\'tilgan');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                centerId: dto.centerId,
                fullName: dto.fullName,
                phone: dto.phone,
                passwordHash,
                role: dto.role,
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
        const token = this.generateToken(user.id, user.phone, user.role, user.centerId);
        return {
            message: 'Muvaffaqiyatli ro\'yxatdan o\'tildi',
            user: {
                ...user,
                trialEndsAt: center.trialEndsAt,
                subscriptionStatus: center.subscriptionStatus,
            },
            accessToken: token,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
            include: { center: true }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Foydalanuvchi akkaunti nofaol qilingan');
        }
        const token = this.generateToken(user.id, user.phone, user.role, user.centerId);
        return {
            message: 'Tizimga muvaffaqiyatli kirildi',
            user: {
                id: user.id,
                centerId: user.centerId,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
                trialEndsAt: user.center?.trialEndsAt,
                subscriptionStatus: user.center?.subscriptionStatus,
            },
            accessToken: token,
        };
    }
    generateToken(userId, phone, role, centerId) {
        return this.jwtService.sign({
            sub: userId,
            phone,
            role,
            centerId,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map