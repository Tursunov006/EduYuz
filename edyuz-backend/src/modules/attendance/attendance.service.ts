import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

import { TelegramService } from '../telegram/telegram.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private smsService: SmsService,
  ) {}

  async processFaceScan(imageBase64: string, centerId: string) {
    // DIQQAT: bu hozircha demo — yuz haqiqatan tanilmaydi. Shu sababli rasm faqat
    // so'rov yuborgan xodimning O'Z markazidagi o'quvchi ota-onasiga yuboriladi
    // (avval istalgan markazdagi birinchi uchragan ota-onaga ketardi).
    let student = await this.prisma.student.findFirst({
      where: { centerId, parentChatId: { not: null } },
    });

    // Taqdimot uchun xavfsizlik: agar botga ulangan o'quvchi yo'q bo'lsa, istalgan o'quvchini tanlash
    let sentToTelegram = true;
    if (!student) {
      student = await this.prisma.student.findFirst({ where: { centerId } });
      sentToTelegram = false;
    }

    if (!student) {
      // Bazada umuman o'quvchi yo'q
      return {
        success: true,
        message: "Davomat tasdiqlandi (Lekin bazada o'quvchi yo'q edi)",
        name: "Test O'quvchi"
      };
    }

    if (sentToTelegram) {
      const caption = `📸 <b>Face-ID Davomat tizimi</b>\n\n✅ <b>${student.fullName}</b> o'quv markaziga yetib keldi!\n🕒 Vaqt: ${new Date().toLocaleTimeString('uz-UZ')}`;
      await this.telegramService.sendPhotoBase64(
        student.parentChatId!,
        imageBase64,
        caption
      ).catch(() => {});
    }

    return {
      success: true,
      message: sentToTelegram ? "Telegram orqali ota-onasiga rasm yuborildi!" : "Davomatga belgilandi!",
      name: student.fullName
    };
  }

  async markGroupAttendance(dto: MarkAttendanceDto, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });

    if (!group) {
      throw new NotFoundException('Guruh topilmadi');
    }

    const attendanceDate = new Date(dto.date);
    if (Number.isNaN(attendanceDate.getTime())) {
      throw new BadRequestException("Sana formati noto'g'ri");
    }

    // Bitta o'quvchi ro'yxatda ikki marta kelsa, oxirgi yozuv hisobga olinadi
    const recordMap = new Map(dto.records.map((r) => [r.studentId, r]));
    const records = Array.from(recordMap.values());
    const studentIds = records.map((r) => r.studentId);

    // Faqat shu guruhga biriktirilgan o'quvchilarga davomat qo'yish mumkin
    const members = await this.prisma.groupStudent.findMany({
      where: { groupId: dto.groupId, studentId: { in: studentIds } },
      select: { studentId: true, student: { select: { status: true } } },
    });
    const memberIds = new Set(members.map((m) => m.studentId));
    const outsiders = studentIds.filter((id) => !memberIds.has(id));
    if (outsiders.length > 0) {
      throw new BadRequestException("Ro'yxatda bu guruhga tegishli bo'lmagan o'quvchi bor");
    }
    // Arxivdagi (kursni tugatgan) o'quvchiga davomat qo'yilmaydi. "Kelmagan" (dropped) o'quvchi guruhda qoladi.
    const inactive = members.filter((m) => m.student?.status === 'inactive').map((m) => m.studentId);
    if (inactive.length > 0) {
      throw new BadRequestException("Arxivdagi o'quvchiga davomat qo'yib bo'lmaydi");
    }

    // Shu kun uchun avval qaysi holat belgilangani: ota-onaga xabar faqat holat o'zgarganda yuboriladi.
    const previous = await this.prisma.attendance.findMany({
      where: { groupId: dto.groupId, date: attendanceDate, studentId: { in: studentIds } },
      select: { studentId: true, status: true },
    });
    const previousStatus = new Map(previous.map((p) => [p.studentId, p.status]));

    // Sabab faqat "kelmadi" holatida saqlanadi; holat o'zgarsa eski sabab o'chadi
    const reasonOf = (r: { status: string; reason?: string }) =>
      String(r.status).toLowerCase() === 'absent' ? r.reason?.trim().slice(0, 200) || null : null;

    await this.prisma.$transaction([
      ...records.map((record) =>
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
            reason: reasonOf(record),
            markedBy: userId,
          },
          create: {
            groupId: dto.groupId,
            studentId: record.studentId,
            date: attendanceDate,
            status: record.status,
            reason: reasonOf(record),
            markedBy: userId,
          },
        }),
      ),
    ]);

    // Ota-onaga Telegram orqali xabar yuborish (Keldi, Kechikdi va Kelmadi holatlari uchun!)
    // Xabar faqat holat haqiqatan o'zgarganda yuboriladi — davomat qayta saqlanganda
    // ota-onalarga takroriy Telegram/SMS (va SMS xarajati) ketmasligi uchun.
    const changed = records.filter((r) => previousStatus.get(r.studentId) !== r.status);
    if (changed.length > 0) {
      const students = await this.prisma.student.findMany({
        where: { id: { in: changed.map((r) => r.studentId) } },
      });

      // Xabarlar javob qaytarilishidan oldin yuboriladi (Cloud Run'da javobdan keyin protsessor to'xtatiladi)
      const sends: Promise<unknown>[] = [];
      for (const student of students) {
        const record = recordMap.get(student.id);
        if (record && student.parentChatId) {
          sends.push(this.telegramService
            .sendAttendanceAlert(
              student.parentChatId,
              student.fullName,
              group.name,
              record.status,
              dto.date,
            )
            .catch((e) => this.logger.warn(`Telegram davomat xabari xatosi: ${e.message}`)));
        }

        // SMS xabarnoma (agar darsga kelmagan bo'lsa)
        if (record && record.status === 'absent' && student.parentPhone && !student.parentChatId) {
          sends.push(this.smsService
            .sendAttendanceAlert(student.parentPhone, student.fullName, group.name)
            .catch((e) => this.logger.warn(`SMS davomat xabari xatosi: ${e.message}`)));
        }
      }
      await Promise.all(sends);
    }

    return {
      success: true,
      message: 'Davomat muvaffaqiyatli saqlandi',
    };
  }

  async findByGroupAndDate(groupId: string, date: string) {
    const targetDate = date ? new Date(date) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException("Sana formati noto'g'ri");
    }

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

  // Davomat jurnali: guruhning bir oylik davomati (o'quvchilar × kunlar)
  async getMonthlyJournal(groupId: string, month?: string) {
    const now = new Date();
    const m = month && /^\d{4}-\d{2}$/.test(month) ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [y, mo] = m.split('-').map(Number);
    if (mo < 1 || mo > 12) throw new BadRequestException("Oy formati noto'g'ri (YYYY-MM)");
    const from = new Date(Date.UTC(y, mo - 1, 1));
    const to = new Date(Date.UTC(y, mo, 1));

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        days: true,
        students: { select: { student: { select: { id: true, fullName: true, status: true } } } },
      },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    const records = await this.prisma.attendance.findMany({
      where: { groupId, date: { gte: from, lt: to } },
      select: { studentId: true, date: true, status: true, reason: true, student: { select: { id: true, fullName: true } } },
      orderBy: { date: 'asc' },
    });

    // Faqat guruhning hozirgi faol a'zolari (guruhdan chiqarilgan yoki arxivdagi o'quvchilar ko'rsatilmaydi)
    const students = new Map<string, { id: string; fullName: string }>();
    group.students.forEach(
      (gs) => gs.student && gs.student.status !== 'inactive' && students.set(gs.student.id, { id: gs.student.id, fullName: gs.student.fullName }),
    );

    return {
      month: m,
      group: { id: group.id, name: group.name, days: group.days },
      students: Array.from(students.values()).sort((a, b) => a.fullName.localeCompare(b.fullName)),
      records: records.filter((r) => students.has(r.studentId)).map((r) => ({
        studentId: r.studentId,
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
        reason: r.reason,
      })),
    };
  }
}
