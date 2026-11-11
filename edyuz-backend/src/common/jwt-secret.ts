import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

let cached: string | null = null;

/**
 * JWT imzolash kaliti uchun yagona manba.
 * Avval token yaratishda va tekshirishda ikki xil zaxira kalit ishlatilgan edi
 * (va ikkalasi ham kodda ochiq yozilgan). Endi kalit faqat JWT_SECRET dan olinadi;
 * sozlanmagan bo'lsa har ishga tushishda tasodifiy kalit yaratiladi.
 */
export function resolveJwtSecret(): string {
  if (cached) return cached;

  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 16) {
    cached = fromEnv;
    return cached;
  }

  cached = randomBytes(48).toString('hex');
  new Logger('Auth').warn(
    fromEnv
      ? "⚠️ JWT_SECRET juda qisqa (kamida 16 belgi kerak). Vaqtinchalik tasodifiy kalit ishlatilmoqda — server qayta ishga tushganda barcha foydalanuvchilar qayta login qilishi kerak bo'ladi."
      : "⚠️ JWT_SECRET sozlanmagan. Vaqtinchalik tasodifiy kalit ishlatilmoqda — server qayta ishga tushganda barcha foydalanuvchilar qayta login qilishi kerak bo'ladi. .env faylida JWT_SECRET ni belgilang.",
  );
  return cached;
}
