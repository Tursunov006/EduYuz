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
                quiz: {
                    include: { questions: true }
                },
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
    async getLessonsByGroupPublic(groupId) {
        const lessons = await this.getLessonsByGroup(groupId);
        return lessons.map((lesson) => ({
            ...lesson,
            quiz: lesson.quiz
                ? {
                    ...lesson.quiz,
                    questions: lesson.quiz.questions.map(({ correctIndex, ...q }) => q),
                }
                : null,
            homeworks: lesson.homeworks.map((hw) => ({
                ...hw,
                submissions: hw.submissions.map((sub) => ({
                    ...sub,
                    student: sub.student ? { id: sub.student.id, fullName: sub.student.fullName } : null,
                })),
            })),
        }));
    }
    async assertStudentInGroup(studentId, groupId) {
        const membership = await this.prisma.groupStudent.findUnique({
            where: { groupId_studentId: { groupId, studentId } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException("O'quvchi bu guruhga biriktirilmagan");
        }
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
        const lesson = await this.prisma.lesson.findUnique({ where: { id } });
        if (!lesson)
            throw new common_1.NotFoundException('Dars topilmadi');
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
        const homework = await this.prisma.homework.findUnique({
            where: { id: dto.homeworkId },
            include: { lesson: { select: { groupId: true } } },
        });
        if (!homework)
            throw new common_1.NotFoundException('Vazifa topilmadi');
        await this.assertStudentInGroup(dto.studentId, homework.lesson.groupId);
        const existing = await this.prisma.homeworkSubmission.findUnique({
            where: {
                homeworkId_studentId: { homeworkId: dto.homeworkId, studentId: dto.studentId },
            },
        });
        if (existing?.status === 'reviewed') {
            throw new common_1.ConflictException("Bu vazifa allaqachon baholangan, qayta topshirib bo'lmaydi");
        }
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
            include: { homework: { select: { maxScore: true, title: true } } },
        });
        if (!submission)
            throw new common_1.NotFoundException('Topshiriq topilmadi');
        const maxScore = submission.homework?.maxScore ?? 100;
        if (dto.score > maxScore) {
            throw new common_1.BadRequestException(`Baho ${maxScore} balldan oshmasligi kerak`);
        }
        const delta = dto.score - (submission.score ?? 0);
        const [updated] = await this.prisma.$transaction([
            this.prisma.homeworkSubmission.update({
                where: { id: submissionId },
                data: {
                    score: dto.score,
                    feedback: dto.feedback,
                    status: 'reviewed',
                    reviewedAt: new Date(),
                },
            }),
            ...(delta !== 0
                ? [
                    this.prisma.student.update({
                        where: { id: submission.studentId },
                        data: {
                            coins: { increment: delta },
                            points: { increment: delta },
                        },
                    }),
                    this.prisma.coinTransaction.create({
                        data: {
                            studentId: submission.studentId,
                            amount: delta,
                            reason: submission.score == null
                                ? `Uyga vazifani ${dto.score} ballga bajargani uchun`
                                : `Uyga vazifa bahosi ${submission.score} dan ${dto.score} ga o'zgartirildi`,
                        },
                    }),
                ]
                : []),
        ]);
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
    async createQuiz(lessonId, title, questions) {
        for (const q of questions) {
            if (q.correctIndex >= q.options.length) {
                throw new common_1.BadRequestException("To'g'ri javob indeksi variantlar sonidan katta");
            }
        }
        const existing = await this.prisma.quiz.findUnique({ where: { lessonId } });
        if (existing) {
            await this.prisma.quiz.delete({ where: { id: existing.id } });
        }
        return this.prisma.quiz.create({
            data: {
                lessonId,
                title,
                questions: {
                    create: questions.map((q) => ({
                        question: q.question,
                        options: q.options,
                        correctIndex: q.correctIndex,
                        points: q.points || 10,
                    })),
                },
            },
            include: { questions: true },
        });
    }
    async submitQuiz(quizId, studentId, answers) {
        const quiz = await this.prisma.quiz.findUnique({
            where: { id: quizId },
            include: { questions: true, lesson: { select: { groupId: true } } },
        });
        if (!quiz)
            throw new common_1.NotFoundException('Test topilmadi');
        const student = await this.prisma.student.findUnique({ where: { id: studentId } });
        if (!student)
            throw new common_1.NotFoundException("O'quvchi topilmadi");
        await this.assertStudentInGroup(studentId, quiz.lesson.groupId);
        let score = 0;
        let maxScore = 0;
        quiz.questions.forEach((q, index) => {
            maxScore += q.points;
            if (answers?.[index] === q.correctIndex) {
                score += q.points;
            }
        });
        const passed = maxScore > 0 && score >= maxScore * 0.6;
        const existing = await this.prisma.quizResult.findUnique({
            where: { quizId_studentId: { quizId, studentId } },
        });
        const firstPass = passed && !existing?.passed;
        const pointsDelta = Math.max(0, score - (existing?.score ?? 0));
        const [result] = await this.prisma.$transaction([
            existing
                ? this.prisma.quizResult.update({
                    where: { id: existing.id },
                    data: {
                        score: Math.max(score, existing.score),
                        maxScore,
                        passed: passed || existing.passed,
                    },
                })
                : this.prisma.quizResult.create({
                    data: { quizId, studentId, score, maxScore, passed },
                }),
            ...(firstPass || pointsDelta > 0
                ? [
                    this.prisma.student.update({
                        where: { id: studentId },
                        data: {
                            coins: { increment: firstPass ? 20 : 0 },
                            points: { increment: pointsDelta },
                        },
                    }),
                ]
                : []),
            ...(firstPass
                ? [
                    this.prisma.coinTransaction.create({
                        data: {
                            studentId,
                            amount: 20,
                            reason: `Testni muvaffaqiyatli topshirdi: ${quiz.title}`,
                        },
                    }),
                ]
                : []),
        ]);
        return { ...result, lastScore: score, lastPassed: passed };
    }
};
exports.LmsService = LmsService;
exports.LmsService = LmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LmsService);
//# sourceMappingURL=lms.service.js.map