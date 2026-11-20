import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  decryptDeep,
  encryptBackupData,
  encryptWriteData,
  hasEncryptionKey,
  isEncrypted,
  SENSITIVE_FIELDS,
  SENSITIVE_MODELS,
} from '../../common/crypto/field-crypto';

/**
 * Serverless (Vercel) muhitida baza manzilini moslaydi.
 * Har bir Vercel funksiya nusxasi o'z ulanishlarini ochadi; Supabase pooler'ining "session" rejimida
 * (5432-port) ulanishlar soni 15 ta bilan cheklangan va tez tugaydi (EMAXCONNSESSION).
 * Shuning uchun Vercel'da "transaction" rejimi (6543-port, pgbouncer=true) va har nusxaga 1 ta ulanish ishlatiladi.
 * Render/Docker/kompyuterda manzil o'zgarmaydi.
 */
export function serverlessDatabaseUrl(raw: string | undefined, isServerless: boolean): string | undefined {
  if (!raw || !isServerless) return raw;
  try {
    const u = new URL(raw);
    if (u.hostname.endsWith('pooler.supabase.com') && (u.port === '5432' || u.port === '')) {
      u.port = '6543';
      u.searchParams.set('pgbouncer', 'true');
    }
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '1');
    return u.toString();
  } catch {
    return raw;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = serverlessDatabaseUrl(process.env.DATABASE_URL, !!process.env.VERCEL);
    super(url && url !== process.env.DATABASE_URL ? { datasources: { db: { url } } } : undefined);
    // Maxfiy maydonlar (pasport, manzil, izoh) bazaga shifrlanib yoziladi va o'qilganda avtomatik ochiladi.
    this.$use(async (params, next) => {
      const model = params.model as string | undefined;
      const a: any = params.args;
      if (model && a) {
        if (SENSITIVE_FIELDS[model]) {
          if (params.action === 'create' || params.action === 'update' || params.action === 'updateMany') {
            encryptWriteData(model, a.data);
          } else if (params.action === 'createMany') {
            for (const d of Array.isArray(a.data) ? a.data : [a.data]) encryptWriteData(model, d);
          } else if (params.action === 'upsert') {
            encryptWriteData(model, a.create);
            encryptWriteData(model, a.update);
          }
        } else if (model === 'StudentBackup') {
          if (params.action === 'create' || params.action === 'update') encryptBackupData(a.data?.data);
          else if (params.action === 'upsert') {
            encryptBackupData(a.create?.data);
            encryptBackupData(a.update?.data);
          }
        }
      }
      const result = await next(params);
      return decryptDeep(result);
    });
  }

  async onModuleInit() {
    await this.$connect();
    // Kalit sozlangan bo'lsa, eski (shifrlanmagan) yozuvlar fonda bir martalik shifrlanadi
    // Vercel'da har "sovuq" ishga tushishda takrorlanmaydi (ulanishlarni band qiladi); bu ish Render'da bajarilgan.
    if (hasEncryptionKey() && !process.env.VERCEL) this.encryptExisting().catch((e) => console.error('Eski ma\'lumotlarni shifrlashda xato:', e));
  }

  // Idempotent: faqat hali shifrlanmagan qatorlarga tegadi, shuning uchun qayta ishga tushirish xavfsiz.
  // Natija: shifrlangan yozuvlar soni.
  async encryptExisting(): Promise<number> {
    if (!hasEncryptionKey()) return 0;
    let total = 0;
    for (const { model, delegate, idField } of SENSITIVE_MODELS) {
      const fields = SENSITIVE_FIELDS[model];
      const d: any = (this as any)[delegate];
      const rows: any[] = await d.findMany({
        // SQL'da `<> ''` NULL qiymatlarni ham chiqarib tashlaydi (majburiy maydonlar uchun `not: null` ishlatib bo'lmaydi)
        where: { OR: fields.map((f) => ({ AND: [{ [f]: { not: '' } }, { NOT: { [f]: { startsWith: 'enc:v1:' } } }] })) },
        select: Object.fromEntries([[idField, true], ...fields.map((f) => [f, true])]),
      });
      // O'qilgan qiymat ochiq matn; yozishda middleware uni shifrlaydi
      for (const row of rows) {
        const data = Object.fromEntries(fields.map((f) => [f, row[f]]));
        await d.update({ where: { [idField]: row[idField] }, data });
      }
      if (rows.length) console.log(`🔐 ${model}: ${rows.length} ta yozuv shifrlandi`);
      total += rows.length;
    }
    const backups = await this.studentBackup.findMany();
    for (const b of backups) {
      const data: any = b.data;
      if (data && typeof data === 'object' && SENSITIVE_FIELDS.Student.some((f) => typeof data[f] === 'string' && data[f] && !isEncrypted(data[f]))) {
        await this.studentBackup.update({ where: { studentId: b.studentId }, data: { data } });
        total++;
      }
    }
    return total;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
