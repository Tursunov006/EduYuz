import { Injectable, NotFoundException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { resolveJwtSecret } from '../../common/jwt-secret';
import { AnketaDto } from './dto/anketa.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const center = await this.prisma.center.findUnique({
      where: { id: dto.centerId },
    });
    if (!center) {
      throw new NotFoundException('Markaz topilmadi');
    }

    const student = await this.prisma.student.create({
      data: {
        centerId: dto.centerId,
        fullName: dto.fullName,
        phone: dto.phone,
        parentPhone: dto.parentPhone,
        parentChatId: dto.parentChatId ? BigInt(dto.parentChatId) : null,
        balance: dto.balance !== undefined ? dto.balance : 0,
        status: dto.status,
        passport: dto.passport?.trim().toUpperCase() || null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        address: dto.address?.trim() || null,
        notes: dto.notes?.trim() || null,
        middleName: dto.middleName?.trim() || null,
        kind: dto.kind || 'oquvchi',
      },
    });
    // O'quvchi qo'shilishi bilan uning ma'lumotlari Arxivga zaxiralanadi
    await this.backup(student.id);
    return student;
  }

  // O'quvchining joriy ma'lumotlari (guruhlar, sertifikatlar, to'lovlar jami bilan) zaxira jadvaliga yoziladi.
  // Zaxira xatosi asosiy amalni to'xtatmasligi kerak, shuning uchun xato faqat logga yoziladi.
  async backup(studentId: string, deleted = false) {
    try {
      const st = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          groups: { include: { group: { select: { name: true } } } },
          certificates: { orderBy: { issuedAt: 'asc' } },
        },
      });
      if (!st) return;
      const paid = await this.prisma.payment.aggregate({
        where: { studentId, amount: { gt: 0 } },
        _sum: { amount: true },
      });
      const data = {
        fullName: st.fullName,
        middleName: st.middleName,
        kind: st.kind,
        phone: st.phone,
        parentPhone: st.parentPhone,
        passport: st.passport,
        birthDate: st.birthDate ? st.birthDate.toISOString().slice(0, 10) : null,
        address: st.address,
        notes: st.notes,
        status: st.status,
        balance: Number(st.balance),
        totalPaid: Number(paid._sum.amount || 0),
        groups: st.groups.map((g) => g.group?.name).filter(Boolean),
        certificates: st.certificates.map((c) => ({
          number: c.certificateNumber,
          course: c.courseTitle,
          grade: c.grade,
          issuedAt: c.issuedAt.toISOString().slice(0, 10),
        })),
        joinedAt: st.createdAt.toISOString(),
      };
      await this.prisma.studentBackup.upsert({
        where: { studentId },
        create: { studentId, centerId: st.centerId, data, deletedAt: deleted ? new Date() : null },
        update: { data, deletedAt: deleted ? new Date() : null },
      });
    } catch (err) {
      console.error('O\'quvchi zaxirasini yozib bo\'lmadi:', err);
    }
  }

  // Arxiv bo'limidagi "O'quvchilar bazasi": barcha o'quvchilar (faol, arxivdagi va o'chirilganlar).
  // Bazadagi o'quvchilar har doim joriy holatda olinadi, o'chirilganlar esa zaxiradan.
  async registry(centerId?: string) {
    const where = { ...(centerId && { centerId }) };
    const [students, paidRows, backups] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          groups: { include: { group: { select: { name: true } } } },
          certificates: { orderBy: { issuedAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.groupBy({
        by: ['studentId'],
        where: { amount: { gt: 0 }, student: where },
        _sum: { amount: true },
      }),
      this.prisma.studentBackup.findMany({ where, orderBy: { updatedAt: 'desc' } }),
    ]);
    const paid = new Map(paidRows.map((p) => [p.studentId, Number(p._sum.amount || 0)]));
    const liveIds = new Set(students.map((s) => s.id));

    const live = students.map((st) => ({
      id: st.id,
      fullName: st.fullName,
      middleName: st.middleName,
      kind: st.kind,
      phone: st.phone,
      parentPhone: st.parentPhone,
      passport: st.passport,
      birthDate: st.birthDate ? st.birthDate.toISOString().slice(0, 10) : null,
      address: st.address,
      notes: st.notes,
      status: st.status,
      balance: Number(st.balance),
      totalPaid: paid.get(st.id) || 0,
      groups: st.groups.map((g) => g.group?.name).filter(Boolean),
      certificates: st.certificates.map((c) => ({
        number: c.certificateNumber,
        course: c.courseTitle,
        grade: c.grade,
        issuedAt: c.issuedAt.toISOString().slice(0, 10),
      })),
      joinedAt: st.createdAt.toISOString(),
      deleted: false,
      deletedAt: null,
    }));
    const removed = backups
      .filter((b) => !liveIds.has(b.studentId))
      .map((b) => ({ id: b.studentId, ...(b.data as any), deleted: true, deletedAt: b.deletedAt || b.updatedAt }));
    return [...live, ...removed];
  }

  // --- O'quvchi o'zi to'ldiradigan anketa ---
  // Havola: /anketa/<id>?k=<kalit>. Kalit server sirida imzolangan, uni taxmin qilib bo'lmaydi
  // va faqat shu o'quvchiga tegishli. Anketa orqali faqat shaxsiy ma'lumotlar o'zgaradi.
  anketaKey(studentId: string): string {
    return createHmac('sha256', resolveJwtSecret()).update(`anketa:${studentId}`).digest('hex').slice(0, 32);
  }

  private checkAnketaKey(studentId: string, key?: string) {
    const a = Buffer.from(String(key || ''));
    const b = Buffer.from(this.anketaKey(studentId));
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      // 404: havola noto'g'ri bo'lsa o'quvchi mavjudligini ham bildirmaymiz
      throw new NotFoundException('Havola noto‘g‘ri yoki eskirgan');
    }
  }

  async getAnketa(studentId: string, key?: string) {
    this.checkAnketaKey(studentId, key);
    const st = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        fullName: true,
        middleName: true,
        phone: true,
        parentPhone: true,
        passport: true,
        birthDate: true,
        address: true,
        center: { select: { name: true } },
      },
    });
    if (!st) throw new NotFoundException('Havola noto‘g‘ri yoki eskirgan');
    return {
      ...st,
      birthDate: st.birthDate ? st.birthDate.toISOString().slice(0, 10) : null,
      centerName: st.center?.name || null,
      center: undefined,
    };
  }

  async saveAnketa(studentId: string, key: string | undefined, dto: AnketaDto) {
    this.checkAnketaKey(studentId, key);
    const exists = await this.prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Havola noto‘g‘ri yoki eskirgan');
    await this.prisma.student.update({
      where: { id: studentId },
      data: {
        fullName: dto.fullName.trim(),
        middleName: dto.middleName?.trim() || null,
        phone: dto.phone?.trim() || null,
        parentPhone: dto.parentPhone.trim(),
        passport: dto.passport?.trim().toUpperCase() || null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        address: dto.address?.trim() || null,
      },
    });
    await this.backup(studentId);
    return { success: true };
  }

  async findAll(centerId?: string, search?: string) {
    return this.prisma.student.findMany({
      where: {
        ...(centerId && { centerId }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { parentPhone: { contains: search } },
          ],
        }),
      },
      include: {
        groups: {
          include: {
            group: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Portal uchun: ota-ona telefoni, Telegram chat ID kabi ichki maydonlarsiz
  async findOnePublic(id: string) {
    const student = await this.findOne(id);
    const { parentPhone, parentChatId, phone, centerId, passport, birthDate, address, notes, ...safe } = student as any;
    return safe;
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            group: {
              include: {
                course: true,
                teacher: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 10,
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        certificates: { orderBy: { issuedAt: 'desc' } },
      },
    });

    if (!student) {
      throw new NotFoundException('O\'quvchi topilmadi');
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);

    const dataToUpdate: any = {
      fullName: dto.fullName,
      phone: dto.phone,
      parentPhone: dto.parentPhone,
      status: dto.status,
    };
    if (dto.passport !== undefined) dataToUpdate.passport = dto.passport?.trim().toUpperCase() || null;
    if (dto.birthDate !== undefined) dataToUpdate.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    if (dto.address !== undefined) dataToUpdate.address = dto.address?.trim() || null;
    if (dto.notes !== undefined) dataToUpdate.notes = dto.notes?.trim() || null;
    if (dto.middleName !== undefined) dataToUpdate.middleName = dto.middleName?.trim() || null;
    if (dto.kind !== undefined) dataToUpdate.kind = dto.kind;

    if (dto.parentChatId !== undefined) {
      dataToUpdate.parentChatId = dto.parentChatId ? BigInt(dto.parentChatId) : null;
    }

    if (dto.balance !== undefined) {
      dataToUpdate.balance = dto.balance;
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: dataToUpdate,
    });
    await this.backup(id);
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    // O'chirishdan oldin oxirgi holat zaxiraga yoziladi: Arxivda "o'chirilgan" bo'lib qoladi
    await this.backup(id, true);

    // Prisma schema da payments Restrict qilingani uchun avval to'lovlar tozalanadi.
    // Ikkala amal bitta tranzaksiyada: o'rtada xato bo'lsa to'lovlar yo'qolib qolmaydi.
    const [, deleted] = await this.prisma.$transaction([
      this.prisma.payment.deleteMany({ where: { studentId: id } }),
      this.prisma.student.delete({ where: { id } }),
    ]);
    return deleted;
  }
}
