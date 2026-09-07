import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const center = await this.prisma.center.findUnique({
      where: { id: dto.centerId },
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
        centerId: dto.centerId,
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

    const token = this.generateToken(user.id, user.phone, user.role, user.centerId);

    return {
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tildi',
      user,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Foydalanuvchi akkaunti nofaol qilingan');
    }

    const token = this.generateToken(user.id, user.phone, user.role, user.centerId);

    return {
      message: 'Tizimga muvaffaqiyatli kirildi',
      user: {
        id: user.id,
        centerId: user.centerId,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
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
