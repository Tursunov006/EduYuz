import { randomBytes } from 'crypto';

describe("Kengaytirilgan shifrlash maydonlari", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  it("o'quvchi otasining ismi, xarajat/oylik izohi, uy vazifa javobi shifrlanadi; ism va telefon ochiq qoladi", async () => {
    const { encryptWriteData, decryptDeep, isEncrypted } = await import('./field-crypto');
    const st: any = { fullName: 'Ali', parentPhone: '+998901112233', middleName: 'Valiyevich', notes: 'izoh' };
    encryptWriteData('Student', st);
    expect(st.fullName).toBe('Ali');
    expect(st.parentPhone).toBe('+998901112233');
    expect(isEncrypted(st.middleName)).toBe(true);
    expect(isEncrypted(st.notes)).toBe(true);

    const exp: any = { title: 'Ijara', amount: 100, comment: 'noyabr' };
    encryptWriteData('Expense', exp);
    expect(exp.title).toBe('Ijara');
    expect(isEncrypted(exp.comment)).toBe(true);

    const sal: any = { comment: { set: 'avans' } };
    encryptWriteData('SalaryPayment', sal);
    expect(isEncrypted(sal.comment.set)).toBe(true);

    const hw: any = { content: 'javob', feedback: 'yaxshi' };
    encryptWriteData('HomeworkSubmission', hw);
    expect(isEncrypted(hw.content) && isEncrypted(hw.feedback)).toBe(true);

    expect(decryptDeep({ st, exp, hw })).toEqual({
      st: { fullName: 'Ali', parentPhone: '+998901112233', middleName: 'Valiyevich', notes: 'izoh' },
      exp: { title: 'Ijara', amount: 100, comment: 'noyabr' },
      hw: { content: 'javob', feedback: 'yaxshi' },
    });
  });

  it("to'lov izohi shifrlanmaydi (Click tranzaksiya belgisi bo'yicha qidiriladi)", async () => {
    const { encryptWriteData } = await import('./field-crypto');
    const p: any = { comment: '(Tr: 123)' };
    encryptWriteData('Payment', p);
    expect(p.comment).toBe('(Tr: 123)');
  });
});
