import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Superadmin parolini server sozlamasi (Render → Environment) orqali boshqarish.
 * SUPERADMIN_PASSWORD berilgan bo'lsa, server ishga tushganda superadmin hisobining paroli
 * shu qiymatga keltiriladi (bazaga SQL yozmasdan parolni tiklash/almashtirish uchun).
 * Telefon: SUPERADMIN_PHONE (berilmasa +998901234567). Parol hech qachon logga yozilmaydi.
 */
@Injectable()
export class SuperadminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger('SuperadminBootstrap');

  constructor(private prisma: PrismaService) {}

  onApplicationBootstrap() {
    // Vercel'da birinchi so'rov bu tekshiruvni (bazaga so'rov + parol xeshi) kutmasligi uchun fonda bajariladi
    const job = this.ensureSuperadmin().catch((e) => this.logger.warn(`Superadmin tekshiruvida xato: ${e?.message}`));
    return process.env.VERCEL ? undefined : job;
  }

  async ensureSuperadmin() {
    const password = process.env.SUPERADMIN_PASSWORD?.trim();
    if (!password) return;
    const phone = process.env.SUPERADMIN_PHONE?.trim() || '+998901234567';
    if (password.length < 8) {
      this.logger.warn('SUPERADMIN_PASSWORD juda qisqa (kamida 8 belgi) — e\'tiborsiz qoldirildi');
      return;
    }
    try {
      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (user) {
        const same = await bcrypt.compare(password, user.passwordHash);
        if (same && user.role === RoleType.superadmin && user.isActive) return;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: same ? user.passwordHash : await bcrypt.hash(password, 10),
            role: RoleType.superadmin,
            isActive: true,
          },
        });
        this.logger.log(`Superadmin (${phone}) paroli/holati SUPERADMIN_PASSWORD bo'yicha yangilandi`);
        return;
      }
      const center = await this.prisma.center.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!center) {
        this.logger.warn('Superadmin yaratib bo\'lmadi: bazada hali o\'quv markazi yo\'q');
        return;
      }
      await this.prisma.user.create({
        data: {
          centerId: center.id,
          fullName: 'Asosiy Administrator',
          phone,
          passwordHash: await bcrypt.hash(password, 10),
          role: RoleType.superadmin,
          isActive: true,
        },
      });
      this.logger.log(`Superadmin (${phone}) yaratildi`);
    } catch (e: any) {
      this.logger.error(`Superadmin parolini o'rnatishda xato: ${e?.message || e}`);
    }
  }
}
