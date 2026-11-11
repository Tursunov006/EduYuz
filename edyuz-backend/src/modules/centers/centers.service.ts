import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

// Chalkashtiruvchi belgilarsiz (0/O, 1/l) tasodifiy vaqtinchalik parol
function generateTempPassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

@Injectable()
export class CentersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCenterDto) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 kunlik bepul sinov muddati

    const center = await this.prisma.center.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        trialEndsAt,
        subscriptionStatus: 'trial',
      },
    });

    // Direktor uchun login profil: barcha markazlarga bir xil "admin123" o'rniga
    // har safar tasodifiy vaqtinchalik parol yaratiladi va faqat shu javobda bir marta ko'rsatiladi.
    const phone = dto.phone.trim();
    const existingUser = await this.prisma.user.findUnique({ where: { phone } });

    let directorPassword: string | null = null;
    if (!existingUser) {
      directorPassword = generateTempPassword();
      await this.prisma.user.create({
        data: {
          centerId: center.id,
          fullName: `${dto.name} Rahbari`,
          phone,
          passwordHash: await bcrypt.hash(directorPassword, 10),
          role: RoleType.admin,
          isActive: true,
        },
      });
    }

    return {
      ...center,
      directorLogin: existingUser ? null : phone,
      directorPassword,
      directorNote: existingUser
        ? 'Bu telefon raqam boshqa hisobga biriktirilgan — direktor hisobi yaratilmadi'
        : null,
    };
  }

  async findAll(onlyCenterId?: string) {
    return this.prisma.center.findMany({
      where: onlyCenterId ? { id: onlyCenterId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
            groups: true,
            students: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const center = await this.prisma.center.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
            groups: true,
            students: true,
          },
        },
      },
    });

    if (!center) {
      throw new NotFoundException('Markaz topilmadi');
    }

    return center;
  }

  async update(id: string, dto: UpdateCenterDto) {
    await this.findOne(id);

    return this.prisma.center.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(
    id: string,
    status: 'active' | 'trial' | 'expired',
    daysToAdd: number = 30,
  ) {
    await this.findOne(id);
    const safeDays = Number.isFinite(Number(daysToAdd)) ? Number(daysToAdd) : 30;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + safeDays);

    const updated = await this.prisma.center.update({
      where: { id },
      data: {
        subscriptionStatus: status,
        trialEndsAt: status === 'expired' ? new Date(0) : trialEndsAt,
      },
    });

    // Agar markaz bloklansa (expired), xodimlarini ham vaqtincha bloklash yoki ochish
    await this.prisma.user.updateMany({
      where: { centerId: id, role: { not: RoleType.superadmin } },
      data: { isActive: status !== 'expired' },
    });

    return updated;
  }

  async resetDirectorPassword(id: string, requestedPassword?: string) {
    const center = await this.findOne(id);
    const newPassword = requestedPassword?.trim() || generateTempPassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Faqat shu markazning direktori (admin) paroli tiklanadi.
    // Avval "markazdagi birinchi uchragan foydalanuvchi" (masalan o'qituvchi yoki
    // boshqa markazdagi xodim) paroli o'zgarib ketishi mumkin edi.
    const user =
      (await this.prisma.user.findFirst({
        where: { centerId: id, phone: center.phone, role: RoleType.admin },
      })) ||
      (await this.prisma.user.findFirst({
        where: { centerId: id, role: RoleType.admin },
        orderBy: { createdAt: 'asc' },
      }));

    let login = center.phone;
    if (user) {
      login = user.phone;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, isActive: true },
      });
    } else {
      const phoneTaken = await this.prisma.user.findUnique({ where: { phone: center.phone } });
      if (phoneTaken) {
        throw new ConflictException(
          'Markaz telefoni boshqa hisobga biriktirilgan — direktor hisobini yaratib bo\'lmadi',
        );
      }
      await this.prisma.user.create({
        data: {
          centerId: id,
          fullName: `${center.name} Rahbari`,
          phone: center.phone,
          passwordHash,
          role: RoleType.admin,
          isActive: true,
        },
      });
    }

    return {
      success: true,
      login,
      password: newPassword,
      message: 'Direktor paroli muvaffaqiyatli yangilandi!',
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    // To'lovlar (Restrict) va guruhlar (kurs/o'qituvchiga Restrict) kaskad o'chirishni
    // to'sib qo'yadi, shuning uchun ular bitta tranzaksiyada avval tozalanadi.
    const [, , deleted] = await this.prisma.$transaction([
      this.prisma.payment.deleteMany({ where: { student: { centerId: id } } }),
      this.prisma.group.deleteMany({ where: { centerId: id } }),
      this.prisma.center.delete({ where: { id } }),
    ]);
    return deleted;
  }
}
