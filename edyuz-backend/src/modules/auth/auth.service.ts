import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { AuthUser } from '../../common/access/access.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TwoFactorService } from './two-factor.service';
import { TelegramService } from '../telegram/telegram.service';
import { makeStaffLinkToken } from './staff-link.util';
import { randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Mavjud bo'lmagan foydalanuvchi uchun taqqoslanadigan soxta bcrypt hash
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj0bq3o3o0y6l8E0y1mG1o9mJ3n2e';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private twoFactor: TwoFactorService,
    private telegram: TelegramService,
  ) {}

  async register(dto: RegisterDto, actor: AuthUser) {
    const isSuperadmin = actor.role === RoleType.superadmin;

    // Oddiy admin faqat o'z markaziga xodim qo'shadi va superadmin rolini bera olmaydi
    const centerId = isSuperadmin ? dto.centerId : actor.centerId;
    if (dto.role === RoleType.superadmin && !isSuperadmin) {
      throw new ForbiddenException("Superadmin rolini berish huquqingiz yo'q");
    }

    const center = await this.prisma.center.findUnique({
      where: { id: centerId },
    });
    if (!center) {
      throw new NotFoundException('Ko\'rsatilgan markaz topilmadi');
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Ushbu telefon raqam bilan ro\'yxatdan o\'tilgan');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        centerId,
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
      },
      select: {
        id: true,
        centerId: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Yangi xodim nomidan token qaytarilmaydi — u o'z login/paroli bilan kiradi
    return {
      message: 'Xodim muvaffaqiyatli ro\'yxatdan o\'tkazildi',
      user: {
        ...user,
        trialEndsAt: center.trialEndsAt,
        subscriptionStatus: center.subscriptionStatus,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { center: true }
    });

    // Foydalanuvchi mavjud bo'lmasa ham bcrypt ishlatiladi — javob vaqti orqali
    // qaysi telefon raqamlar ro'yxatdan o'tganini aniqlab bo'lmasligi uchun.
    const isMatch = await bcrypt
      .compare(dto.password, user?.passwordHash || DUMMY_HASH)
      .catch(() => false);
    if (!user || !isMatch) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Foydalanuvchi akkaunti nofaol qilingan');
    }

    // 2 bosqichli kirish yoqilgan bo'lsa: kod Telegram'ga yuboriladi, token kod tasdiqlangach beriladi
    if (user.twoFactorEnabled && user.telegramChatId) {
      const challengeId = await this.twoFactor.issue(user.id, user.telegramChatId, 'login');
      return {
        twoFactorRequired: true,
        challengeId,
        message: 'Tasdiqlash kodi Telegram botga yuborildi',
      };
    }

    return this.buildLoginResponse(user);
  }

  // Kod to'g'ri bo'lsa kirishni yakunlaydi (2 bosqichli kirishning 2-bosqichi)
  async verifyLogin(challengeId: string, code: string) {
    const userId = await this.twoFactor.verify(challengeId, code, 'login');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { center: true } });
    if (!user || !user.isActive) throw new UnauthorizedException('Foydalanuvchi akkaunti nofaol qilingan');
    return this.buildLoginResponse(user);
  }

  private async buildLoginResponse(user: any) {
    let trialEndsAt = user.center?.trialEndsAt;
    const subscriptionStatus = user.center?.subscriptionStatus || 'trial';

    if (user.center && subscriptionStatus === 'trial' && !trialEndsAt) {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      trialEndsAt = d;
      await this.prisma.center
        .update({
          where: { id: user.center.id },
          data: { trialEndsAt: d, subscriptionStatus: 'trial' },
        })
        .catch(() => {});
    }

    const token = this.generateToken(user.id, user.phone, user.role, user.centerId);

    return {
      message: 'Tizimga muvaffaqiyatli kirildi',
      user: {
        id: user.id,
        centerId: user.centerId,
        centerName: user.center?.name,
        centerLogo: user.center?.logoUrl || null,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        trialEndsAt,
        subscriptionStatus,
      },
      accessToken: token,
    };
  }

  async profile(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, include: { center: true } });
    if (!u) throw new UnauthorizedException();
    return {
      id: u.id,
      centerId: u.centerId,
      centerName: u.center?.name,
      centerLogo: u.center?.logoUrl || null,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      trialEndsAt: u.center?.trialEndsAt,
      subscriptionStatus: u.center?.subscriptionStatus || 'trial',
    };
  }

  // --- 2 bosqichli kirishni boshqarish (xodimning o'zi uchun) ---
  async twoFactorStatus(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true, twoFactorEnabled: true },
    });
    if (!u) throw new UnauthorizedException();
    const linked = u.telegramChatId != null;
    let botLink: string | null = null;
    if (!linked) {
      const bot = await this.telegram.getBotUsername();
      if (bot) botLink = `https://t.me/${bot}?start=staff_${makeStaffLinkToken(userId)}`;
    }
    return { enabled: u.twoFactorEnabled, linked, botLink };
  }

  async twoFactorStartEnable(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true } });
    if (!u?.telegramChatId) throw new ForbiddenException('Avval Telegram botni ulang');
    const challengeId = await this.twoFactor.issue(userId, u.telegramChatId, 'enable');
    return { challengeId };
  }

  async twoFactorConfirmEnable(userId: string, challengeId: string, code: string) {
    const owner = await this.twoFactor.verify(challengeId, code, 'enable');
    if (owner !== userId) throw new UnauthorizedException('Kod noto\'g\'ri yoki muddati tugagan');
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return { enabled: true };
  }

  async twoFactorDisable(userId: string, password: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    const ok = await bcrypt.compare(String(password || ''), u?.passwordHash || DUMMY_HASH).catch(() => false);
    if (!u || !ok) throw new UnauthorizedException('Parol noto\'g\'ri');
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false } });
    return { enabled: false };
  }

  // Telegramga kira olmay qolgan xodim uchun (faqat superadmin): 2 bosqichli kirish va ulanish o'chiriladi
  async twoFactorReset(targetUserId: string) {
    const r = await this.prisma.user.updateMany({
      where: { id: targetUserId },
      data: { twoFactorEnabled: false, telegramChatId: null },
    });
    if (r.count === 0) throw new NotFoundException('Xodim topilmadi');
    return { enabled: false };
  }

  // --- Parolni Telegram bot orqali tiklash ---
  // Telefon raqam ro'yxatdan o'tgan-o'tmaganini bildirmaslik uchun javob har doim bir xil
  async forgotPassword(phone: string) {
    const generic = { message: 'Agar raqam Telegram botga ulangan bo\'lsa, tiklash kodi yuborildi' };
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true, isActive: true, telegramChatId: true },
    });
    if (user && user.isActive && user.telegramChatId) {
      try {
        const challengeId = await this.twoFactor.issue(user.id, user.telegramChatId, 'reset');
        return { ...generic, challengeId };
      } catch {
        // yuborib bo'lmadi yoki juda tez so'raldi: tashqariga farq bildirilmaydi
      }
    }
    return { ...generic, challengeId: randomUUID() };
  }

  async resetPassword(challengeId: string, code: string, newPassword: string) {
    const userId = await this.twoFactor.verify(challengeId, code, 'reset');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const r = await this.prisma.user.updateMany({ where: { id: userId, isActive: true }, data: { passwordHash } });
    if (r.count === 0) throw new UnauthorizedException('Kod noto\'g\'ri yoki muddati tugagan');
    // Egasi biladigan bo'lishi uchun: parol o'zgargani haqida Telegramga xabar (yuborilmasa ham parol yangilangan bo'lib qoladi)
    const owner = await this.prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true } });
    if (owner?.telegramChatId) {
      await this.telegram
        .sendMessage(
          owner.telegramChatId,
          '🔑 <b>EduYuz: parolingiz o\'zgartirildi.</b>\n\nAgar buni siz qilmagan bo\'lsangiz, darhol administratorga xabar bering va parolni qayta almashtiring.',
        )
        .catch(() => {});
    }
    return { message: 'Parol yangilandi. Yangi parol bilan kiring' };
  }

  private generateToken(userId: string, phone: string, role: string, centerId: string) {
    return this.jwtService.sign({
      sub: userId,
      phone,
      role,
      centerId,
    });
  }
}
