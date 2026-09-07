import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

import { TelegramService } from '../telegram/telegram.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private smsService: SmsService,
  ) {}

  async markGroupAttendance(dto: MarkAttendanceDto, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });

    if (!group) {
      throw new NotFoundException('Guruh topilmadi');
    }

    const attendanceDate = new Date(dto.date);

    const operations = dto.records.map((record) =>
      this.prisma.attendance.upsert({
        where: {
          groupId_studentId_date: {
            groupId: dto.groupId,
            studentId: record.studentId,
            date: attendanceDate,
          },
        },
        update: {
          status: record.status,
          markedBy: userId,
        },
        create: {
          groupId: dto.groupId,
          studentId: record.studentId,
          date: attendanceDate,
          status: record.status,
          markedBy: userId,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    // Darsga kelgan o'quvchilarga +10 EduCoin rag'bati
    const presentRecords = dto.records.filter((r) => r.status === 'present');
    for (const rec of presentRecords) {
      this.prisma.student
        .update({
          where: { id: rec.studentId },
          data: { coins: { increment: 10 }, points: { increment: 10 } },
        })
        .catch(() => {});
      this.prisma.coinTransaction
        .create({
          data: {
            studentId: rec.studentId,
            amount: 10,
            reason: `Darsga o'z vaqtida kelgani uchun (${group.name})`,
          },
        })
        .catch(() => {});
    }

    // Ota-onaga Telegram orqali xabar yuborish (kelmagan yoki kechikkan bo'lsa)
    const absentOrLateRecords = dto.records.filter(
      (r) => r.status === 'absent' || r.status === 'late',
    );

    if (absentOrLateRecords.length > 0) {
      const studentIds = absentOrLateRecords.map((r) => r.studentId);
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds } },
      });

      for (const student of students) {
        const record = absentOrLateRecords.find((r) => r.studentId === student.id);
        if (record && student.parentChatId) {
          this.telegramService
            .sendAttendanceAlert(
              student.parentChatId,
              student.fullName,
              group.name,
              record.status,
              dto.date,
            )
            .catch(() => {});
        }

        // SMS xabarnoma (agar darsga kelmagan bo'lsa)
        if (record && record.status === 'absent' && student.parentPhone) {
          this.smsService
            .sendAttendanceAlert(student.parentPhone, student.fullName, group.name)
            .catch(() => {});
        }
      }
    }

    return {
      success: true,
      message: 'Davomat muvaffaqiyatli saqlandi',
    };
  }

  async findByGroupAndDate(groupId: string, date: string) {
    const targetDate = new Date(date);

    return this.prisma.attendance.findMany({
      where: {
        groupId,
        date: targetDate,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        marker: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });
  }

  async getStudentAttendance(studentId: string) {
    return this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }
}
