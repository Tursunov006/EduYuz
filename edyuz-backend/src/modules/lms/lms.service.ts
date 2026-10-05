import { Injectable, NotFoundException } from '@nestjs/common';
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
    const homework = await this.prisma.homework.findUnique({ where: { id: dto.homeworkId } });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

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
    });
    if (!submission) throw new NotFoundException('Topshiriq topilmadi');

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
        .catch(() => {});

      this.prisma.coinTransaction
        .create({
          data: {
            studentId: submission.studentId,
            amount: dto.score,
            reason: `Uyga vazifani ${dto.score} ballga bajargani uchun`,
          },
        })
        .catch(() => {});
    }

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

  // --- QUIZ & GAMIFICATION LOGIC ---
  async createQuiz(lessonId: string, title: string, questions: any[]) {
    return this.prisma.quiz.create({
      data: {
        lessonId,
        title,
        questions: {
          create: questions.map(q => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            points: q.points || 10
          }))
        }
      },
      include: { questions: true }
    });
  }

  async submitQuiz(quizId: string, studentId: string, answers: number[]) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }
    });
    if (!quiz) throw new NotFoundException('Test topilmadi');

    let score = 0;
    let maxScore = 0;
    quiz.questions.forEach((q, index) => {
      maxScore += q.points;
      if (answers[index] === q.correctIndex) {
        score += q.points;
      }
    });

    const passed = score >= (maxScore * 0.6); // 60% for passing

    if (passed) {
      await this.prisma.student.update({
        where: { id: studentId },
        data: {
          coins: { increment: 20 },
          points: { increment: score }
        }
      });
      
      await this.prisma.coinTransaction.create({
        data: {
          studentId,
          amount: 20,
          reason: `Testni muvaffaqiyatli topshirdi: ${quiz.title}`
        }
      });
    }

    // Save result (upsert to allow retries or just create)
    const existing = await this.prisma.quizResult.findUnique({
       where: { quizId_studentId: { quizId, studentId } }
    });
    if (existing) {
       return this.prisma.quizResult.update({
         where: { id: existing.id },
         data: { score, maxScore, passed }
       });
    }
    return this.prisma.quizResult.create({
      data: { quizId, studentId, score, maxScore, passed }
    });
  }
}
