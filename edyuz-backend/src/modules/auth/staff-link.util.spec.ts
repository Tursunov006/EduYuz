import { makeStaffLinkToken, parseStaffLinkToken } from './staff-link.util';

describe('staff-link token', () => {
  const id = '397a7239-bc64-4671-bfb0-0123456789ab';

  it('to\'g\'ri token xodim ID\'sini qaytaradi', () => {
    expect(parseStaffLinkToken(makeStaffLinkToken(id))).toBe(id);
  });

  it('Telegram start parametri 64 belgidan oshmaydi', () => {
    expect(('staff_' + makeStaffLinkToken(id)).length).toBeLessThanOrEqual(64);
  });

  it('muddati o\'tgan token rad etiladi', () => {
    const t = makeStaffLinkToken(id, Date.now() - 16 * 60 * 1000);
    expect(parseStaffLinkToken(t)).toBeNull();
  });

  it('o\'zgartirilgan token (boshqa xodim ID\'si) rad etiladi', () => {
    const t = makeStaffLinkToken(id);
    const other = 'ffffffffffffffffffffffffffffffff' + t.slice(32);
    expect(parseStaffLinkToken(other)).toBeNull();
    expect(parseStaffLinkToken('abc')).toBeNull();
  });
});
