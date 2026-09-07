import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AwardCoinsDto } from './dto/award-coins.dto';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  // 1. Umumiy Leaderboard (Top 20 o'quvchi)
  async getLeaderboard(groupId?: string) {
    const where: any = { status: 'active' };

    if (groupId) {
      where.groups = {
        some: { groupId },
      };
    }

    const students = await this.prisma.student.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        coins: true,
        points: true,
        groups: {
          include: {
            group: {
              select: {
                name: true,
                course: {
                  select: { title: true },
                },
              },
            },
          },
        },
      },
      orderBy: { coins: 'desc' },
      take: 30,
    });

    return students.map((s, idx) => ({
      rank: idx + 1,
      id: s.id,
      fullName: s.fullName,
      coins: s.coins,
      points: s.points,
      groupName: s.groups[0]?.group?.name || 'Guruhsiz',
      courseTitle: s.groups[0]?.group?.course?.title || 'Umumiy kurs',
    }));
  }

  // 2. O'quvchiga Coin berish / yechish
  async awardCoins(dto: AwardCoinsDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('O\'quvchi topilmadi');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id: dto.studentId },
        data: {
          coins: {
            increment: dto.amount,
          },
          points: dto.amount > 0 ? { increment: dto.amount } : undefined,
        },
      });

      await tx.coinTransaction.create({
        data: {
          studentId: dto.studentId,
          amount: dto.amount,
          reason: dto.reason,
        },
      });

      return updated;
    });
  }

  // 3. O'quvchining coin tarixi
  async getStudentHistory(studentId: string) {
    return this.prisma.coinTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
