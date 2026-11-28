import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { resolveJwtSecret } from '../../common/jwt-secret';

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_GAP_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

export type ChallengePurpose = 'login' | 'enable';

// Bir martalik kod (OTP): 6 xonali, 5 daqiqa amal qiladi, 5 marta urinish mumkin, Telegram orqali yuboriladi.
@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  private hash(challengeId: string, code: string): string {
    return createHash('sha256').update(`${resolveJwtSecret()}:${challengeId}:${code}`).digest('hex');
  }

  // Kod yaratib Telegram'ga yuboradi; challenge ID qaytaradi
  async issue(userId: string, chatId: bigint, purpose: ChallengePurpose): Promise<string> {
    const now = Date.now();
    await this.prisma.loginChallenge.deleteMany({ where: { userId, expiresAt: { lt: new Date(now) } } });
    const recent = await this.prisma.loginChallenge.findFirst({
      where: { userId, purpose, createdAt: { gt: new Date(now - RESEND_GAP_MS) } },
    });
    if (recent) throw new BadRequestException('Kod yaqinda yuborilgan, 30 soniyadan keyin qayta urinib ko\'ring');

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const row = await this.prisma.loginChallenge.create({
      data: { userId, purpose, codeHash: 'pending', expiresAt: new Date(now + CODE_TTL_MS) },
    });
    await this.prisma.loginChallenge.update({ where: { id: row.id }, data: { codeHash: this.hash(row.id, code) } });

    const text =
      purpose === 'login'
        ? `🔐 <b>EduYuz kirish kodi:</b> <code>${code}</code>\n\nKod 5 daqiqa amal qiladi. Uni hech kimga bermang. Agar siz kirmayotgan bo'lsangiz, parolingizni almashtiring.`
        : `🔐 <b>EduYuz: 2 bosqichli kirishni yoqish kodi:</b> <code>${code}</code>\n\nKod 5 daqiqa amal qiladi.`;
    const sent = await this.telegram.sendMessage(chatId, text);
    if (!sent) {
      await this.prisma.loginChallenge.delete({ where: { id: row.id } }).catch(() => {});
      throw new BadRequestException('Kodni Telegramga yuborib bo\'lmadi, birozdan so\'ng qayta urinib ko\'ring');
    }
    return row.id;
  }

  // Kodni tekshiradi; to'g'ri bo'lsa xodim ID'sini qaytaradi va kodni o'chiradi
  async verify(challengeId: string, code: string, purpose: ChallengePurpose): Promise<string> {
    const bad = () => new UnauthorizedException('Kod noto\'g\'ri yoki muddati tugagan');
    const row = await this.prisma.loginChallenge.findUnique({ where: { id: String(challengeId || '') } });
    if (!row || row.purpose !== purpose || row.expiresAt.getTime() < Date.now()) throw bad();
    if (row.attempts >= MAX_ATTEMPTS) {
      await this.prisma.loginChallenge.delete({ where: { id: row.id } }).catch(() => {});
      throw bad();
    }
    await this.prisma.loginChallenge.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });

    const a = Buffer.from(this.hash(row.id, String(code || '').trim()));
    const b = Buffer.from(row.codeHash);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw bad();
    await this.prisma.loginChallenge.delete({ where: { id: row.id } }).catch(() => {});
    return row.userId;
  }
}
