import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CentersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCenterDto) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 kunlik bepul sinov muddati

    const center = await this.prisma.center.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        trialEndsAt,
        subscriptionStatus: 'trial',
      },
    });

    // Direktor uchun avtomatik login profil (parol: admin123) yaratish
    try {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const existingUser = await this.prisma.user.findUnique({
        where: { phone: dto.phone.trim() },
      });

      if (!existingUser) {
        await this.prisma.user.create({
          data: {
            centerId: center.id,
            fullName: `${dto.name} Rahbari`,
            phone: dto.phone.trim(),
            passwordHash,
            role: RoleType.admin,
            isActive: true,
          },
        });
      }
    } catch (e) {
      // Agar telefon band bo'lsa xato bermasdan markazni qaytaradi
    }

    return center;
  }

  async findAll() {
    return this.prisma.center.findMany({
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
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + daysToAdd);

    const updated = await this.prisma.center.update({
      where: { id },
      data: {
        subscriptionStatus: status,
        trialEndsAt: status === 'expired' ? new Date(0) : trialEndsAt,
      },
    });

    // Agar markaz bloklansa (expired), xodimlarini ham vaqtincha bloklash yoki ochish
    await this.prisma.user
      .updateMany({
        where: { centerId: id, role: { not: RoleType.superadmin } },
        data: { isActive: status !== 'expired' },
      })
      .catch(() => {});

    return updated;
  }

  async resetDirectorPassword(id: string, newPassword: string = 'admin123') {
    const center = await this.findOne(id);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ centerId: id }, { phone: center.phone }],
      },
    });

    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, isActive: true },
      });
    } else {
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
      login: center.phone,
      password: newPassword,
      message: 'Direktor paroli muvaffaqiyatli yangilandi!',
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.center.delete({
      where: { id },
    });
  }
}
