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

  private async getEskizToken(): Promise<string | null> {
    const email = this.configService.get<string>('ESKIZ_EMAIL');
    const password = this.configService.get<string>('ESKIZ_PASSWORD');

    if (!email || !password || email === 'info@eduyuz.uz') {
      return null;
    }

    if (this.eskizToken && Date.now() < this.tokenExpiresAt) {
      return this.eskizToken;
    }

    try {
      const res = await fetch('https://notify.eskiz.uz/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return null;

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

  async sendSms(phone: string, message: string): Promise<{ success: boolean; status: string }> {
    const cleanPhone = this.cleanPhone(phone);
    const token = await this.getEskizToken();
    const from = this.configService.get<string>('ESKIZ_FROM') || '4546';

    let status = 'sent';

    if (token) {
      try {
        const formData = new URLSearchParams();
        formData.append('mobile_phone', cleanPhone);
        formData.append('message', message);
        formData.append('from', from);

        const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          status = 'failed';
          this.logger.warn(`Eskiz SMS yuborishda xatolik: ${res.statusText}`);
        }
      } catch (err: any) {
        status = 'failed';
        this.logger.error(`Eskiz tarmoq xatosi: ${err.message}`);
      }
    } else {
      // Demo / Mahalliy rejim
      this.logger.log(`📱 [SMS Demo Gateway] ${cleanPhone} raqamiga xabar: "${message}"`);
      status = 'demo';
    }

    // Bazada SMS jurnalini saqlash
    await this.prisma.smsLog.create({
      data: {
        phone: cleanPhone,
        message,
        status,
      },
    });

    return { success: status !== 'failed', status };
  }

  // 1. Davomatda kelmaganlik xabarnomasi
  async sendAttendanceAlert(parentPhone: string, studentName: string, groupName: string) {
    if (!parentPhone) return;
    const msg = `EduYuz: Hurmatli ota-ona! Farzandingiz ${studentName} bugun ${groupName} darsiga qatnashmadi.`;
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
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  }
}
