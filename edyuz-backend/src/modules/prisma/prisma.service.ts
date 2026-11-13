import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { decryptDeep, encryptBackupData, encryptWriteData, hasEncryptionKey, isEncrypted } from '../../common/crypto/field-crypto';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    // Maxfiy maydonlar (pasport, manzil, izoh) bazaga shifrlanib yoziladi va o'qilganda avtomatik ochiladi.
    this.$use(async (params, next) => {
      const model = params.model as string | undefined;
      const a: any = params.args;
      if (model && a) {
        if (model === 'Student') {
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
    if (hasEncryptionKey()) this.encryptExisting().catch((e) => console.error('Eski ma\'lumotlarni shifrlashda xato:', e));
  }

  // Idempotent: faqat hali shifrlanmagan qatorlarga tegadi, shuning uchun har ishga tushganda xavfsiz.
  private async encryptExisting() {
    const students = await this.$queryRaw<{ id: string }[]>`
      SELECT id FROM students
      WHERE (passport IS NOT NULL AND passport <> '' AND passport NOT LIKE 'enc:v1:%')
         OR (address IS NOT NULL AND address <> '' AND address NOT LIKE 'enc:v1:%')
         OR (notes IS NOT NULL AND notes <> '' AND notes NOT LIKE 'enc:v1:%')`;
    for (const { id } of students) {
      // O'qish natijasi deshifrlanadi (oddiy matn o'zgarmaydi), yozishda esa shifrlanadi
      const st = await this.student.findUnique({ where: { id }, select: { passport: true, address: true, notes: true } });
      if (!st) continue;
      await this.student.update({ where: { id }, data: { passport: st.passport, address: st.address, notes: st.notes } });
    }
    const backups = await this.studentBackup.findMany();
    let n = 0;
    for (const b of backups) {
      const d: any = b.data;
      if (d && typeof d === 'object' && ['passport', 'address', 'notes'].some((f) => typeof d[f] === 'string' && d[f] && !isEncrypted(d[f]))) {
        await this.studentBackup.update({ where: { studentId: b.studentId }, data: { data: d } });
        n++;
      }
    }
    if (students.length || n) console.log(`🔐 ${students.length} ta o'quvchi va ${n} ta zaxira yozuvi shifrlandi`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
