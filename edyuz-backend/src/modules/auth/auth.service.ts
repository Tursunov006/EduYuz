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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Mavjud bo'lmagan foydalanuvchi uchun taqqoslanadigan soxta bcrypt hash
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj0bq3o3o0y6l8E0y1mG1o9mJ3n2e';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        trialEndsAt,
        subscriptionStatus,
      },
      accessToken: token,
    };
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
