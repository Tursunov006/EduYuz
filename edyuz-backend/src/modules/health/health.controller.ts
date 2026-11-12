import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

// Holat tekshiruvi: server ishlayaptimi va bazaga ulanish bormi.
// GitHub Actions (.github/workflows/keepalive.yml) buni muntazam chaqiradi: Render bepul serveri
// uxlab qolmaydi, Supabase bepul bazasi esa "ishlatilmayapti" deb to'xtatib qo'yilmaydi.
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
    return { status: 'ok', db: 'up', time: new Date().toISOString() };
  }
}
