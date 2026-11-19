import { serverlessDatabaseUrl } from './prisma.service';

describe('serverlessDatabaseUrl', () => {
  const session = 'postgresql://u:p@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';
  it("serverless bo'lmasa manzil o'zgarmaydi", () => {
    expect(serverlessDatabaseUrl(session, false)).toBe(session);
  });
  it('Supabase session pooler -> transaction rejimi, 1 ulanish', () => {
    const u = new URL(serverlessDatabaseUrl(session, true)!);
    expect(u.port).toBe('6543');
    expect(u.searchParams.get('pgbouncer')).toBe('true');
    expect(u.searchParams.get('connection_limit')).toBe('1');
    expect(u.username).toBe('u');
  });
  it("boshqa baza: faqat connection_limit qo'shiladi, mavjudi saqlanadi", () => {
    expect(new URL(serverlessDatabaseUrl('postgresql://u:p@db.example.com:5432/x', true)!).searchParams.get('connection_limit')).toBe('1');
    expect(serverlessDatabaseUrl('postgresql://u:p@h:5432/x?connection_limit=3', true)).toContain('connection_limit=3');
  });
});
