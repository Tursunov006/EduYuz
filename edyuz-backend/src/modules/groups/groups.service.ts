import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentToGroupDto } from './dto/add-student.dto';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
  ) {}

  async create(dto: CreateGroupDto, creatorId: string) {
    // Markaz controller'da foydalanuvchi tokenidan aniqlanadi.
    // (Avval markaz berilmasa bazadagi "birinchi uchragan" markaz olinardi —
    // ya'ni guruh begona markazga yozilib qolishi mumkin edi.)
    const centerId = dto.centerId;
    if (!centerId) {
      throw new BadRequestException('Markaz aniqlanmadi');
    }

    // Kurs tanlanmagan bo'lsa — shu markazning birinchi kursi yoki standart kurs
    let courseId = dto.courseId;
    if (!courseId) {
      let course = await this.prisma.course.findFirst({ where: { centerId } });
      if (!course) {
        course = await this.prisma.course.create({
          data: { title: 'Dasturlash Asoslari', price: 500000, centerId },
        });
      }
      courseId = course.id;
    }

    // O'qituvchi tanlanmagan bo'lsa — shu markazning birinchi o'qituvchisi,
    // u ham bo'lmasa guruhni yaratayotgan xodimning o'zi.
    // (Avval qat'iy "+998900000001" raqamli, yaroqsiz parol hash'li soxta o'qituvchi
    // yaratilardi; telefon unikal bo'lgani uchun ikkinchi markazda bu xatoga olib kelardi.)
    let teacherId = dto.teacherId;
    if (!teacherId) {
      const teacher = await this.prisma.user.findFirst({
        where: { centerId, role: 'teacher', isActive: true },
      });
      teacherId = teacher?.id || creatorId;
    }

    let formattedDays = dto.days;
    if (typeof dto.days === 'string') {
      formattedDays = dto.days.split(/[-,\/]/).map((s: string) => s.trim());
    }

    return this.prisma.group.create({
      data: {
        centerId,
        courseId,
        teacherId,
        name: dto.name,
        room: dto.room?.trim() || null,
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

  async findAll(centerId?: string, courseId?: string, teacherId?: string, archived = false) {
    return this.prisma.group.findMany({
      where: {
        archivedAt: archived ? { not: null } : null,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  // "Dars boshlanyapti" xabari: guruhdagi faol o'quvchilarning Telegram botga ulangan ota-onalariga yuboriladi.
  // Telegramga ulanmaganlarga hech narsa ketmaydi (ular natijada alohida sanaladi).
  async notifyLessonStart(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { students: { include: { student: true } } },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const active = group.students.map((gs) => gs.student).filter((st) => st.status === 'active');
    let sent = 0;
    let failed = 0;
    let noTelegram = 0;
    const seen = new Set<string>();

    for (const st of active) {
      if (!st.parentChatId) {
        noTelegram++;
        continue;
      }
      const text =
        `⏰ <b>Dars boshlanyapti!</b>\n\n` +
        `Farzandingiz <b>${esc(st.fullName)}</b>ning <b>${esc(group.name)}</b> guruhi darsi ` +
        `<b>${esc(group.startTime)}</b> da boshlanadi.`;
      const key = `${st.parentChatId}:${st.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const ok = await this.telegram.sendMessage(st.parentChatId, text).catch(() => false);
      if (ok) sent++;
      else failed++;
    }

    return {
      sent,
      failed,
      noTelegram,
      total: active.length,
      message:
        sent > 0
          ? `${sent} ta ota-onaga xabar yuborildi` + (noTelegram ? `, ${noTelegram} tasi Telegram'ga ulanmagan` : '')
          : active.length === 0
            ? "Guruhda faol o'quvchi yo'q"
            : "Xabar yuborilmadi: ota-onalar Telegram botga ulanmagan",
    };
  }

  async findOne(id: string) {
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
      throw new NotFoundException('Guruh topilmadi');
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findOne(id);

    // Kunlar formadan "Dush-Chor-Jum" ko'rinishida keladi: yaratishdagi kabi ro'yxatga aylantiriladi
    const { archived, ...rest } = dto;
    const data: any = { ...rest };
    if (dto.room !== undefined) data.room = dto.room?.trim() || null;
    if (archived !== undefined) {
      data.archivedAt = archived ? new Date() : null;
    }
    if (typeof dto.days === 'string') {
      data.days = dto.days.split(/[-,\/]/).map((s: string) => s.trim()).filter(Boolean);
    }

    return this.prisma.group.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.group.delete({
      where: { id },
    });
  }

  async addStudent(groupId: string, dto: AddStudentToGroupDto) {
    await this.findOne(groupId);

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new NotFoundException('O\'quvchi topilmadi');
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
      throw new ConflictException('O\'quvchi ushbu guruhga allaqachon biriktirilgan');
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

  async removeStudent(groupId: string, studentId: string) {
    const record = await this.prisma.groupStudent.findUnique({
      where: {
        groupId_studentId: {
          groupId,
          studentId,
        },
      },
    });

    if (!record) {
      throw new NotFoundException('O\'quvchi ushbu guruhda mavjud emas');
    }

    // Guruhdan chiqarilganda shu guruhdagi bugungi va keyingi kunlar davomati ham o'chiriladi
    // (o'tgan kunlar tarixi saqlanadi). Avval chiqarilgan o'quvchi bugun "keldi" bo'lib qolardi.
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const [, removed] = await this.prisma.$transaction([
      this.prisma.attendance.deleteMany({ where: { groupId, studentId, date: { gte: today } } }),
      this.prisma.groupStudent.delete({
        where: { groupId_studentId: { groupId, studentId } },
      }),
    ]);
    return removed;
  }
}
