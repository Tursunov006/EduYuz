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
exports.LmsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LmsService = class LmsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLessonsByGroup(groupId) {
        return this.prisma.lesson.findMany({
            where: { groupId },
            include: {
                homeworks: {
                    include: {
                        submissions: {
                            include: {
                                student: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        phone: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { orderIndex: 'asc' },
        });
    }
    async createLesson(dto) {
        const group = await this.prisma.group.findUnique({ where: { id: dto.groupId } });
        if (!group)
            throw new common_1.NotFoundException('Guruh topilmadi');
        return this.prisma.lesson.create({
            data: {
                groupId: dto.groupId,
                title: dto.title,
                content: dto.content,
                videoUrl: dto.videoUrl,
                fileUrl: dto.fileUrl,
                orderIndex: dto.orderIndex || 1,
            },
        });
    }
    async deleteLesson(id) {
        return this.prisma.lesson.delete({
            where: { id },
        });
    }
    async createHomework(dto) {
        const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
        if (!lesson)
            throw new common_1.NotFoundException('Dars topilmadi');
        return this.prisma.homework.create({
            data: {
                lessonId: dto.lessonId,
                title: dto.title,
                description: dto.description,
                deadline: dto.deadline ? new Date(dto.deadline) : null,
                maxScore: dto.maxScore || 100,
            },
        });
    }
    async submitHomework(dto) {
        const homework = await this.prisma.homework.findUnique({ where: { id: dto.homeworkId } });
        if (!homework)
            throw new common_1.NotFoundException('Vazifa topilmadi');
        return this.prisma.homeworkSubmission.upsert({
            where: {
                homeworkId_studentId: {
                    homeworkId: dto.homeworkId,
                    studentId: dto.studentId,
                },
            },
            update: {
                content: dto.content,
                fileUrl: dto.fileUrl,
                status: 'pending',
                submittedAt: new Date(),
            },
            create: {
                homeworkId: dto.homeworkId,
                studentId: dto.studentId,
                content: dto.content,
                fileUrl: dto.fileUrl,
                status: 'pending',
            },
        });
    }
    async gradeSubmission(submissionId, dto) {
        const submission = await this.prisma.homeworkSubmission.findUnique({
            where: { id: submissionId },
        });
        if (!submission)
            throw new common_1.NotFoundException('Topshiriq topilmadi');
        const updated = await this.prisma.homeworkSubmission.update({
            where: { id: submissionId },
            data: {
                score: dto.score,
                feedback: dto.feedback,
                status: 'reviewed',
                reviewedAt: new Date(),
            },
        });
        if (dto.score > 0) {
            this.prisma.student
                .update({
                where: { id: submission.studentId },
                data: {
                    coins: { increment: dto.score },
                    points: { increment: dto.score },
                },
            })
                .catch(() => { });
            this.prisma.coinTransaction
                .create({
                data: {
                    studentId: submission.studentId,
                    amount: dto.score,
                    reason: `Uyga vazifani ${dto.score} ballga bajargani uchun`,
                },
            })
                .catch(() => { });
        }
        return updated;
    }
    async getSubmissionsByHomework(homeworkId) {
        return this.prisma.homeworkSubmission.findMany({
            where: { homeworkId },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }
};
exports.LmsService = LmsService;
exports.LmsService = LmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LmsService);
//# sourceMappingURL=lms.service.js.map