import { createHmac, timingSafeEqual } from 'crypto';
import { resolveJwtSecret } from '../../common/jwt-secret';

// Xodimni Telegram botga ulash havolasi uchun qisqa muddatli imzolangan token.
// Telegram start parametri 64 belgigacha: "staff_" + 32 hex + "_" + muddat(base36) + "_" + imzo(12 hex)
const TTL_MS = 15 * 60 * 1000;

function sign(userHex: string, expB36: string): string {
  return createHmac('sha256', resolveJwtSecret()).update(`staff-link:${userHex}:${expB36}`).digest('hex').slice(0, 12);
}

export function makeStaffLinkToken(userId: string, now = Date.now()): string {
  const userHex = userId.replace(/-/g, '');
  const exp = (now + TTL_MS).toString(36);
  return `${userHex}_${exp}_${sign(userHex, exp)}`;
}

// Token to'g'ri va muddati o'tmagan bo'lsa xodim ID'sini (UUID shaklida) qaytaradi
export function parseStaffLinkToken(token: string, now = Date.now()): string | null {
  const m = /^([0-9a-f]{32})_([0-9a-z]{1,10})_([0-9a-f]{12})$/.exec(String(token || '').trim());
  if (!m) return null;
  const [, userHex, expB36, sig] = m;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(userHex, expB36));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (parseInt(expB36, 36) < now) return null;
  return `${userHex.slice(0, 8)}-${userHex.slice(8, 12)}-${userHex.slice(12, 16)}-${userHex.slice(16, 20)}-${userHex.slice(20)}`;
}
