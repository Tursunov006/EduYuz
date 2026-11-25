import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private eskizToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private cleanPhone(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 9) {
      clean = '998' + clean;
    }
    return clean;
  }

  // Eskiz hisobi sozlanganmi (ESKIZ_EMAIL va ESKIZ_PASSWORD berilganmi)
  isConfigured(): boolean {
    const email = this.configService.get<string>('ESKIZ_EMAIL')?.trim();
    const password = this.configService.get<string>('ESKIZ_PASSWORD')?.trim();
    return !!email && !!password && email !== 'info@eduyuz.uz';
  }

  private async getEskizToken(force = false): Promise<string | null> {
    if (!this.isConfigured()) return null;
    if (!force && this.eskizToken && Date.now() < this.tokenExpiresAt) {
      return this.eskizToken;
    }
    const email = this.configService.get<string>('ESKIZ_EMAIL')!.trim();
    const password = this.configService.get<string>('ESKIZ_PASSWORD')!.trim();
    try {
      const res = await fetch('https://notify.eskiz.uz/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        this.logger.warn(`Eskiz kirish rad etildi (HTTP ${res.status}): email yoki parol noto'g'ri bo'lishi mumkin`);
        return null;
      }
      const data = await res.json();
      if (data?.data?.token) {
        this.eskizToken = data.data.token;
        this.tokenExpiresAt = Date.now() + 25 * 24 * 3600 * 1000;
        return this.eskizToken;
      }
    } catch (err: any) {
      this.logger.error(`Eskiz auth xatosi: ${err.message}`);
    }
    return null;
  }

  // Eskiz hisobidagi qoldiq (SMS soni). Sozlanmagan yoki xato bo'lsa null.
  async getBalance(): Promise<number | null> {
    const token = await this.getEskizToken();
    if (!token) return null;
    try {
      const res = await fetch('https://notify.eskiz.uz/api/user/get-limit', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const left = Number(data?.data?.balance);
      return Number.isFinite(left) ? left : null;
    } catch {
      return null;
    }
  }

  async getStatus() {
    return { configured: this.isConfigured(), balance: this.isConfigured() ? await this.getBalance() : null };
  }

  private async postToEskiz(token: string, phone: string, message: string, from: string) {
    const formData = new URLSearchParams();
    formData.append('mobile_phone', phone);
    formData.append('message', message);
    formData.append('from', from);
    return fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  }

  // Haqiqiy SMS yuboradi. Natija statusi: 'sent' | 'failed' | 'not_configured'.
  // Hech qachon "yuborildi" deb yolg'on aytmaydi: Eskiz javobi tekshiriladi.
  async sendSms(phone: string, message: string): Promise<{ success: boolean; status: string; error?: string }> {
    const cleanPhone = this.cleanPhone(phone);
    if (!this.isConfigured()) {
      this.logger.warn('SMS yuborilmadi: ESKIZ_EMAIL / ESKIZ_PASSWORD sozlanmagan');
      return { success: false, status: 'not_configured', error: 'SMS xizmati sozlanmagan' };
    }

    const from = this.configService.get<string>('ESKIZ_FROM')?.trim() || '4546';
    let status = 'failed';
    let error: string | undefined;

    try {
      let token = await this.getEskizToken();
      if (!token) {
        error = "Eskiz'ga kirib bo'lmadi (email yoki parol noto'g'ri)";
      } else {
        let res = await this.postToEskiz(token, cleanPhone, message, from);
        if (res.status === 401) {
          // Token muddati tugagan: bir marta qayta kirib, yana urinamiz
          token = await this.getEskizToken(true);
          if (token) res = await this.postToEskiz(token, cleanPhone, message, from);
        }
        const body: any = await res.json().catch(() => ({}));
        const providerStatus = String(body?.status ?? '').toLowerCase();
        if (res.ok && providerStatus !== 'error') {
          status = 'sent';
        } else {
          error = body?.message || `Eskiz xatosi (HTTP ${res.status})`;
          this.logger.warn(`Eskiz SMS yuborilmadi: ${error}`);
        }
      }
    } catch (err: any) {
      error = `Tarmoq xatosi: ${err.message}`;
      this.logger.error(`Eskiz tarmoq xatosi: ${err.message}`);
    }

    await this.prisma.smsLog.create({ data: { phone: cleanPhone, message, status } });
    return { success: status === 'sent', status, ...(error ? { error } : {}) };
  }

  // 1. Davomatda kelmaganlik xabarnomasi
  async sendAttendanceAlert(parentPhone: string, studentName: string, groupName: string, reason?: string) {
    if (!parentPhone) return;
    const why = reason?.trim() ? ` Izoh: ${reason.trim()}.` : '';
    const msg = `EduYuz: Hurmatli ota-ona! Farzandingiz ${studentName} bugun ${groupName} darsiga qatnashmadi.${why}`;
    return this.sendSms(parentPhone, msg);
  }

  // 2. To'lov qabul qilinganlik kvitansiyasi
  async sendPaymentReceipt(parentPhone: string, studentName: string, amount: number, newBalance: number) {
    if (!parentPhone) return;
    const msg = `EduYuz: Farzandingiz ${studentName} uchun ${amount.toLocaleString()} so'm to'lov qabul qilindi. Joriy balans: ${newBalance.toLocaleString()} so'm.`;
    return this.sendSms(parentPhone, msg);
  }

  // 3. Qarzdorlik eslatmasi
  async sendDebtAlert(parentPhone: string, studentName: string, debtAmount: number, groupName: string) {
    if (!parentPhone) return;
    const msg = `EduYuz Eslatma: Farzandingiz ${studentName}ning ${groupName} darsi uchun ${Math.abs(debtAmount).toLocaleString()} so'm qarzdorligi mavjud. Iltimos to'lovni amalga oshiring.`;
    return this.sendSms(parentPhone, msg);
  }

  // Jurnallarni olish
  async getLogs() {
    return this.prisma.smsLog.findMany({
      where: {
        status: {
          notIn: ['lead_new', 'lead_contacted', 'lead_trial', 'lead_converted'],
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  }
}
