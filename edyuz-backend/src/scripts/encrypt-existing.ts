// Deploy paytida (Vercel build) bir marta ishga tushadi: hali shifrlanmagan eski yozuvlarni shifrlaydi.
// ENCRYPTION_KEY bo'lmasa yoki baza ulanmasa — build to'xtatilmaydi, faqat ogohlantirish chiqadi.
import { PrismaService } from '../modules/prisma/prisma.service';
import { hasEncryptionKey } from '../common/crypto/field-crypto';

async function main() {
  if (!hasEncryptionKey()) {
    console.warn("ENCRYPTION_KEY yo'q — eski yozuvlarni shifrlash o'tkazib yuborildi");
    return;
  }
  const prisma = new PrismaService();
  try {
    const n = await prisma.encryptExisting();
    console.log(`🔐 Shifrlash tekshiruvi tugadi: ${n} ta yozuv shifrlandi`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.warn('Eski yozuvlarni shifrlashda xato (build davom etadi):', e?.message || e);
});
