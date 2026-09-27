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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GroupsService = class GroupsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        let centerId = dto.centerId;
        if (!centerId) {
            let center = await this.prisma.center.findFirst();
            if (!center) {
                center = await this.prisma.center.create({
                    data: { name: "EdYuz Bosh Markaz", phone: "+998901234567" },
                });
            }
            centerId = center.id;
        }
        let courseId = dto.courseId;
        if (!courseId) {
            let course = await this.prisma.course.findFirst({ where: { centerId } });
            if (!course) {
                course = await this.prisma.course.create({
                    data: { title: "Dasturlash Asoslari", price: 500000, centerId },
                });
            }
            courseId = course.id;
        }
        let teacherId = dto.teacherId;
        if (!teacherId) {
            let teacher = await this.prisma.user.findFirst({ where: { centerId, role: 'teacher' } });
            if (!teacher) {
                teacher = await this.prisma.user.create({
                    data: {
                        centerId,
                        fullName: "Bosh O'qituvchi",
                        phone: "+998900000001",
                        passwordHash: "defaultpasswordhash",
                        role: 'teacher',
                    },
                });
            }
            teacherId = teacher.id;
        }
        let formattedDays = dto.days;
        if (typeof dto.days === 'string') {
            formattedDays = dto.days.split(/[-,\/]/).map((s) => s.trim());
        }
        return this.prisma.group.create({
            data: {
                centerId,
                courseId,
                teacherId,
                name: dto.name,
                days: formattedDays || ['Dushanba', 'Chorshanba', 'Juma'],
                startTime: dto.startTime,
                endTime: dto.endTime,
            },
            include: {
                course: true,
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
            },
        });
    }
    async findAll(centerId, courseId, teacherId) {
        return this.prisma.group.findMany({
            where: {
                ...(centerId && { centerId }),
                ...(courseId && { courseId }),
                ...(teacherId && { teacherId }),
            },
            include: {
                course: true,
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
                _count: {
                    select: {
                        students: true,
                    },
                },
            },
        });
    }
    async findOne(id) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: {
                course: true,
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
                students: {
                    include: {
                        student: true,
                    },
                },
            },
        });
        if (!group) {
            throw new common_1.NotFoundException('Guruh topilmadi');
        }
        return group;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.group.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.group.delete({
            where: { id },
        });
    }
    async addStudent(groupId, dto) {
        await this.findOne(groupId);
        const student = await this.prisma.student.findUnique({
            where: { id: dto.studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('O\'quvchi topilmadi');
        }
        const existing = await this.prisma.groupStudent.findUnique({
            where: {
                groupId_studentId: {
                    groupId,
                    studentId: dto.studentId,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('O\'quvchi ushbu guruhga allaqachon biriktirilgan');
        }
        return this.prisma.groupStudent.create({
            data: {
                groupId,
                studentId: dto.studentId,
            },
            include: {
                student: true,
            },
        });
    }
    async removeStudent(groupId, studentId) {
        const record = await this.prisma.groupStudent.findUnique({
            where: {
                groupId_studentId: {
                    groupId,
                    studentId,
                },
            },
        });
        if (!record) {
            throw new common_1.NotFoundException('O\'quvchi ushbu guruhda mavjud emas');
        }
        return this.prisma.groupStudent.delete({
            where: {
                groupId_studentId: {
                    groupId,
                    studentId,
                },
            },
        });
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map