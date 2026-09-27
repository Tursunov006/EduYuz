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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StudentsService = class StudentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const center = await this.prisma.center.findUnique({
            where: { id: dto.centerId },
        });
        if (!center) {
            throw new common_1.NotFoundException('Markaz topilmadi');
        }
        return this.prisma.student.create({
            data: {
                centerId: dto.centerId,
                fullName: dto.fullName,
                phone: dto.phone,
                parentPhone: dto.parentPhone,
                parentChatId: dto.parentChatId ? BigInt(dto.parentChatId) : null,
                balance: dto.balance !== undefined ? dto.balance : 0,
                status: dto.status,
            },
        });
    }
    async findAll(centerId, search) {
        return this.prisma.student.findMany({
            where: {
                ...(centerId && { centerId }),
                ...(search && {
                    OR: [
                        { fullName: { contains: search } },
                        { phone: { contains: search } },
                        { parentPhone: { contains: search } },
                    ],
                }),
            },
            include: {
                groups: {
                    include: {
                        group: {
                            include: {
                                course: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async findOne(id) {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                groups: {
                    include: {
                        group: {
                            include: {
                                course: true,
                                teacher: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
                payments: {
                    orderBy: { paidAt: 'desc' },
                    take: 10,
                },
                attendances: {
                    orderBy: { date: 'desc' },
                    take: 10,
                },
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('O\'quvchi topilmadi');
        }
        return student;
    }
    async update(id, dto) {
        await this.findOne(id);
        const dataToUpdate = {
            fullName: dto.fullName,
            phone: dto.phone,
            parentPhone: dto.parentPhone,
            status: dto.status,
        };
        if (dto.parentChatId !== undefined) {
            dataToUpdate.parentChatId = dto.parentChatId ? BigInt(dto.parentChatId) : null;
        }
        if (dto.balance !== undefined) {
            dataToUpdate.balance = dto.balance;
        }
        return this.prisma.student.update({
            where: { id },
            data: dataToUpdate,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.student.delete({
            where: { id },
        });
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
//# sourceMappingURL=students.service.js.map