import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

@Injectable()
export class LmsService {
  constructor(private prisma: PrismaService) {}

  // 1. Guruh darslari va ularning vazifalari
  async getLessonsByGroup(groupId: string) {
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

  // 1b. O'quvchi portali uchun darslar: testning to'g'ri javoblari (correctIndex)
  // va boshqa o'quvchilarning telefon raqamlari qaytarilmaydi.
  async getLessonsByGroupPublic(groupId: string) {
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

  // O'quvchi shu guruhga (darsga) biriktirilganini tekshirish
  private async assertStudentInGroup(studentId: string, groupId: string) {
    const membership = await this.prisma.groupStudent.findUnique({
      where: { groupId_studentId: { groupId, studentId } },
    });
    if (!membership) {
      throw new ForbiddenException("O'quvchi bu guruhga biriktirilmagan");
    }
  }

  // 2. Yangi dars yaratish
  async createLesson(dto: CreateLessonDto) {
    const group = await this.prisma.group.findUnique({ where: { id: dto.groupId } });
    if (!group) throw new NotFoundException('Guruh topilmadi');

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

  // 3. Darsni o'chirish
  async deleteLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  // 4. Darsga uyga vazifa biriktirish
  async createHomework(dto: CreateHomeworkDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

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

  // 5. Vazifaga javob topshirish (O'quvchi tomonidan)
  async submitHomework(dto: SubmitHomeworkDto) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: dto.homeworkId },
      include: { lesson: { select: { groupId: true } } },
    });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

    // Faqat shu guruh o'quvchisi topshira oladi (begona ID bilan topshirib bo'lmaydi)
    await this.assertStudentInGroup(dto.studentId, homework.lesson.groupId);

    // Baholangan ishni qayta yozib, bahoni "pending" ga qaytarib bo'lmaydi
    const existing = await this.prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: { homeworkId: dto.homeworkId, studentId: dto.studentId },
      },
    });
    if (existing?.status === 'reviewed') {
      throw new ConflictException("Bu vazifa allaqachon baholangan, qayta topshirib bo'lmaydi");
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

  // 6. Vazifani baholash va izoh yozish (O'qituvchi tomonidan)
  async gradeSubmission(submissionId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: { homework: { select: { maxScore: true, title: true } } },
    });
    if (!submission) throw new NotFoundException('Topshiriq topilmadi');

    const maxScore = submission.homework?.maxScore ?? 100;
    if (dto.score > maxScore) {
      throw new BadRequestException(`Baho ${maxScore} balldan oshmasligi kerak`);
    }

    const updated = await this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        status: 'reviewed',
        reviewedAt: new Date(),
      },
    });

    return updated;
  }

  // 7. Bitta vazifaga topshirilgan barcha javoblarni olish
  async getSubmissionsByHomework(homeworkId: string) {
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

  // --- QUIZ LOGIC ---
  async createQuiz(lessonId: string, title: string, questions: any[]) {
    for (const q of questions) {
      if (q.correctIndex >= q.options.length) {
        throw new BadRequestException("To'g'ri javob indeksi variantlar sonidan katta");
      }
    }

    // Bitta darsga bitta test: mavjud bo'lsa yangisi bilan almashtiriladi
    // (avval ikkinchi marta yaratishda unikal cheklov xatosi — 500 chiqardi)
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

  async submitQuiz(quizId: string, studentId: string, answers: number[]) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true, lesson: { select: { groupId: true } } },
    });
    if (!quiz) throw new NotFoundException('Test topilmadi');

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");
    await this.assertStudentInGroup(studentId, quiz.lesson.groupId);

    let score = 0;
    let maxScore = 0;
    quiz.questions.forEach((q, index) => {
      maxScore += q.points;
      if (answers?.[index] === q.correctIndex) {
        score += q.points;
      }
    });

    const passed = maxScore > 0 && score >= maxScore * 0.6; // 60% for passing

    const existing = await this.prisma.quizResult.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
    });

    // Qayta topshirishda eng yaxshi natija saqlanadi
    const result = existing
      ? await this.prisma.quizResult.update({
          where: { id: existing.id },
          data: {
            score: Math.max(score, existing.score),
            maxScore,
            passed: passed || existing.passed,
          },
        })
      : await this.prisma.quizResult.create({
          data: { quizId, studentId, score, maxScore, passed },
        });

    return { ...result, lastScore: score, lastPassed: passed };
  }
}
