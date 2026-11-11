import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { PrismaService } from '../../modules/prisma/prisma.service';

export interface AuthUser {
  id: string;
  centerId: string;
  fullName: string;
  phone: string;
  role: RoleType;
  isActive: boolean;
}

/**
 * Multi-tenant himoya: har bir markaz xodimi faqat o'z markazi ma'lumotlarini
 * ko'ra oladi va o'zgartira oladi. Superadmin barcha markazlarga kira oladi.
 */
@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  isSuperadmin(user?: AuthUser | null): boolean {
    return user?.role === RoleType.superadmin;
  }

  /**
   * Ro'yxat so'rovlari uchun markaz filtri.
   * Oddiy xodim: har doim o'z markazi. Superadmin: so'ralgan markaz (yoki hammasi).
   */
  scopeCenter(user: AuthUser, requested?: string): string | undefined {
    if (this.isSuperadmin(user)) return requested || undefined;
    return user.centerId;
  }

  /**
   * Yangi yozuv yaratishda ishlatiladigan markaz ID.
   * Oddiy xodim: har doim o'z markazi. Superadmin: so'ralgan markaz yoki o'ziniki.
   */
  centerForCreate(user: AuthUser, requested?: string): string {
    if (this.isSuperadmin(user)) return requested || user.centerId;
    return user.centerId;
  }

  assertCenter(user: AuthUser, centerId: string | null | undefined, notFoundMessage = "Ma'lumot topilmadi") {
    if (!centerId) throw new NotFoundException(notFoundMessage);
    if (this.isSuperadmin(user)) return;
    // Boshqa markaz ma'lumoti mavjudligini oshkor qilmaslik uchun 404 qaytariladi
    if (centerId !== user.centerId) throw new NotFoundException(notFoundMessage);
  }

  async center(user: AuthUser, centerId: string) {
    if (!this.isSuperadmin(user) && centerId !== user.centerId) {
      throw new ForbiddenException("Bu markazga kirish huquqingiz yo'q");
    }
  }

  async student(user: AuthUser, studentId: string) {
    const row = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { centerId: true },
    });
    this.assertCenter(user, row?.centerId, "O'quvchi topilmadi");
  }

  async group(user: AuthUser, groupId: string) {
    const row = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { centerId: true },
    });
    this.assertCenter(user, row?.centerId, 'Guruh topilmadi');
  }

  async course(user: AuthUser, courseId: string) {
    const row = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { centerId: true },
    });
    this.assertCenter(user, row?.centerId, 'Kurs topilmadi');
  }

  async staff(user: AuthUser, userId: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { centerId: true, role: true },
    });
    this.assertCenter(user, row?.centerId, 'Foydalanuvchi topilmadi');
    // Oddiy admin superadmin hisobiga tegina olmaydi
    if (row.role === RoleType.superadmin && !this.isSuperadmin(user)) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return row;
  }

  async expense(user: AuthUser, expenseId: string) {
    const row = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      select: { centerId: true },
    });
    this.assertCenter(user, row?.centerId, 'Xarajat topilmadi');
  }

  async payment(user: AuthUser, paymentId: string) {
    const row = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { student: { select: { centerId: true } } },
    });
    this.assertCenter(user, row?.student?.centerId, "To'lov topilmadi");
  }

  async lesson(user: AuthUser, lessonId: string) {
    const row = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { group: { select: { centerId: true } } },
    });
    this.assertCenter(user, row?.group?.centerId, 'Dars topilmadi');
  }

  async homework(user: AuthUser, homeworkId: string) {
    const row = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      select: { lesson: { select: { group: { select: { centerId: true } } } } },
    });
    this.assertCenter(user, row?.lesson?.group?.centerId, 'Vazifa topilmadi');
  }

  async submission(user: AuthUser, submissionId: string) {
    const row = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      select: { student: { select: { centerId: true } } },
    });
    this.assertCenter(user, row?.student?.centerId, 'Topshiriq topilmadi');
  }
}
