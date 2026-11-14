import { Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Maxfiy shaxsiy ma'lumotlar (pasport, manzil, izoh) bazada AES-256-GCM bilan shifrlangan holda saqlanadi.
 * Kalit faqat serverning ENCRYPTION_KEY muhit o'zgaruvchisida turadi (kodda yoki GitHub'da emas),
 * shuning uchun bazaga yoki zaxira nusxasiga kirgan odam ham asl matnni o'qiy olmaydi.
 *
 * Format: "enc:v1:" + base64(iv[12] | tag[16] | shifrlangan matn)
 */
const PREFIX = 'enc:v1:';
const logger = new Logger('FieldCrypto');

let keyCache: Buffer | null | undefined;

function getKey(): Buffer | null {
  if (keyCache !== undefined) return keyCache;
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) {
    logger.warn("⚠️ ENCRYPTION_KEY sozlanmagan — maxfiy maydonlar hozircha SHIFRLANMAY saqlanmoqda. Render'da ENCRYPTION_KEY ni qo'shing.");
    return (keyCache = null);
  }
  if (raw.length < 32) {
    logger.warn("⚠️ ENCRYPTION_KEY juda qisqa (kamida 32 belgi kerak) — shifrlash o'chirilgan.");
    return (keyCache = null);
  }
  // Har qanday uzunlikdagi kalitdan aniq 32 baytlik kalit olinadi
  return (keyCache = createHash('sha256').update(raw).digest());
}

export function hasEncryptionKey(): boolean {
  return getKey() !== null;
}

export function isEncrypted(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith(PREFIX);
}

export function encryptField<T>(value: T): T {
  if (typeof value !== 'string' || value === '' || isEncrypted(value)) return value;
  const key = getKey();
  if (!key) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return (PREFIX + Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64')) as unknown as T;
}

export function decryptField<T>(value: T): T {
  if (!isEncrypted(value)) return value;
  const key = getKey();
  if (!key) return value;
  try {
    const buf = Buffer.from((value as string).slice(PREFIX.length), 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8') as unknown as T;
  } catch {
    logger.error("Maydonni deshifrlab bo'lmadi (ENCRYPTION_KEY o'zgargan bo'lishi mumkin)");
    return value;
  }
}

/** Natija ichidagi barcha shifrlangan satrlarni (ichma-ich bo'lsa ham) asl holiga qaytaradi. */
export function decryptDeep<T>(data: T): T {
  if (typeof data === 'string') return decryptField(data);
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) data[i] = decryptDeep(data[i]);
    return data;
  }
  if (data && typeof data === 'object' && !(data instanceof Date) && !(data instanceof Uint8Array)) {
    const o = data as Record<string, unknown>;
    for (const k of Object.keys(o)) o[k] = decryptDeep(o[k]);
  }
  return data;
}

/** Shifrlanadigan maydonlar: model → maydon nomlari */
export const SENSITIVE_FIELDS: Record<string, string[]> = {
  Student: ['passport', 'address', 'notes'],
};

/** Yozishdan oldin: data ichidagi maxfiy maydonlarni shifrlaydi (oddiy qiymat yoki { set } ko'rinishida). */
export function encryptWriteData(model: string, data: any) {
  const fields = SENSITIVE_FIELDS[model];
  if (!fields || !data || typeof data !== 'object') return;
  for (const f of fields) {
    const v = data[f];
    if (typeof v === 'string') data[f] = encryptField(v);
    else if (v && typeof v === 'object' && typeof v.set === 'string') v.set = encryptField(v.set);
  }
}

/** Zaxira jadvali (StudentBackup.data JSON) ichidagi maxfiy maydonlar ham shifrlanadi. */
export function encryptBackupData(data: any) {
  if (!data || typeof data !== 'object') return;
  for (const f of ['passport', 'address', 'notes']) {
    if (typeof data[f] === 'string') data[f] = encryptField(data[f]);
  }
}
