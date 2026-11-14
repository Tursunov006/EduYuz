// Maxfiy maydonlarni shifrlash: kalit bilan to'liq aylanish, ichma-ich natijalar va kalit bo'lmagan holat
describe('field-crypto', () => {
  const load = (key?: string) => {
    jest.resetModules();
    if (key === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = key;
    return require('./field-crypto') as typeof import('./field-crypto');
  };

  it('shifrlaydi va qaytadan ochadi', () => {
    const c = load('k'.repeat(40));
    const enc = c.encryptField('AA1234567');
    expect(enc).toMatch(/^enc:v1:/);
    expect(enc).not.toContain('AA1234567');
    expect(c.decryptField(enc)).toBe('AA1234567');
  });

  it('har safar boshqa shifr hosil qiladi va ikki marta shifrlamaydi', () => {
    const c = load('k'.repeat(40));
    const a = c.encryptField('Toshkent');
    expect(c.encryptField('Toshkent')).not.toBe(a);
    expect(c.encryptField(a)).toBe(a);
  });

  it('ichma-ich natijalarni ochadi, boshqa qiymatlarga tegmaydi', () => {
    const c = load('k'.repeat(40));
    const when = new Date('2026-01-01');
    const data = { list: [{ passport: c.encryptField('AB1'), fullName: 'Ali', n: 5, d: when }] };
    expect(c.decryptDeep(data)).toEqual({ list: [{ passport: 'AB1', fullName: 'Ali', n: 5, d: when }] });
  });

  it('Student yozuvida faqat maxfiy maydonlarni shifrlaydi ({ set } ham)', () => {
    const c = load('k'.repeat(40));
    const d: any = { fullName: 'Ali', passport: 'AB1', address: { set: 'Toshkent' }, notes: null };
    c.encryptWriteData('Student', d);
    expect(d.fullName).toBe('Ali');
    expect(c.isEncrypted(d.passport)).toBe(true);
    expect(c.isEncrypted(d.address.set)).toBe(true);
    expect(d.notes).toBeNull();
  });

  it("kalit bo'lmasa yoki qisqa bo'lsa matnni o'zgartirmaydi", () => {
    expect(load().encryptField('AA1')).toBe('AA1');
    expect(load('short').encryptField('AA1')).toBe('AA1');
  });

  it("boshqa kalit bilan ochib bo'lmaydi (matn o'zgarmay qaytadi)", () => {
    const enc = load('a'.repeat(40)).encryptField('secret');
    expect(load('b'.repeat(40)).decryptField(enc)).toBe(enc);
  });
});
