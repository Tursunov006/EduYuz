import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentType } from '@prisma/client';

import { TelegramService } from '../telegram/telegram.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private smsService: SmsService,
    private configService: ConfigService,
  ) {}

  private md5(value: string): string {
    return createHash('md5').update(value).digest('hex');
  }

  // Imzolarni vaqt bo'yicha hujumga chidamli taqqoslash
  private safeEqual(a: string, b: string): boolean {
    const x = Buffer.from(String(a || '').toLowerCase());
    const y = Buffer.from(String(b || '').toLowerCase());
    return x.length === y.length && timingSafeEqual(x, y);
  }

  // To'lov tizimi tranzaksiyasi allaqachon yozilganmi (webhook qayta kelganda ikki marta
  // balans oshmasligi uchun). Tranzaksiya ID izoh ichidagi "(Tr: ...)" belgisi orqali topiladi.
  private async findByExternalRef(studentId: string, ref: string) {
    return this.prisma.payment.findFirst({
      where: { studentId, comment: { contains: `(Tr: ${ref})` } },
    });
  }

  async create(dto: CreatePaymentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new NotFoundException('O\'quvchi topilmadi');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          studentId: dto.studentId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          comment: dto.comment,
        },
        include: {
          student: true,
        },
      });

      // Talaba balansini oshirish
      const updatedStudent = await tx.student.update({
        where: { id: dto.studentId },
        data: {
          balance: {
            increment: dto.amount,
          },
        },
      });

      return { payment, newBalance: Number(updatedStudent.balance) };
    });

    // Telegramga kvitansiya yuborish
    if (student.parentChatId) {
      this.telegramService
        .sendPaymentReceipt(
          student.parentChatId,
          student.fullName,
          dto.amount,
          dto.paymentMethod,
          result.newBalance,
          dto.comment,
        )
        .catch((e) => this.logger.error(`Telegram to'lov cheki xatosi: ${e.message}`));
    }

    // SMS orqali kvitansiya yuborish
    if (student.parentPhone) {
      this.smsService
        .sendPaymentReceipt(
          student.parentPhone,
          student.fullName,
          dto.amount,
          result.newBalance,
        )
        .catch((e) => this.logger.error(`SMS to'lov cheki xatosi: ${e.message}`));
    }

    return result.payment;
  }

  // Oylik avtomatik to'lov yechish (Avtomatik Billing)
  async chargeMonthly(centerId: string, groupId?: string) {
    const groups = await this.prisma.group.findMany({
      // Arxivdagi (kursi tugagan) guruhlardan oylik to'lov yechilmaydi
      where: { centerId, archivedAt: null, ...(groupId ? { id: groupId } : {}) },
      include: {
        course: true,
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    // Joriy oy chegaralari — bir oyda bir guruh uchun bir martadan ortiq yechilmasligi uchun
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let count = 0;
    let skipped = 0;
    let totalCharged = 0;

    for (const group of groups) {
      const price = Number(group.course?.price || 0);
      if (price <= 0 || !group.students) continue;

      // Izoh qat'iy formatda: guruh ID si orqali takroriy yechishni aniqlaymiz
      const marker = `[oylik:${group.id}:${period}]`;
      const comment = `${group.name} guruhi uchun oylik to'lov yechildi ${marker}`;

      for (const item of group.students) {
        const student = item.student;
        if (!student || student.status !== 'active') continue;

        // Tugma ikki marta bosilsa yoki so'rov qayta yuborilsa — ikkinchi marta yechilmaydi
        const already = await this.prisma.payment.findFirst({
          where: {
            studentId: student.id,
            amount: { lt: 0 },
            paidAt: { gte: monthStart, lt: monthEnd },
            OR: [
              { comment: { contains: marker } },
              // Eski formatdagi (markersiz) yozuvlar bilan ham mos kelishi uchun
              { comment: `${group.name} guruhi uchun oylik to'lov yechildi` },
            ],
          },
          select: { id: true },
        });
        if (already) {
          skipped++;
          continue;
        }

        const [updatedStudent] = await this.prisma.$transaction([
          this.prisma.student.update({
            where: { id: student.id },
            data: {
              balance: {
                decrement: price,
              },
            },
          }),
          this.prisma.payment.create({
            data: {
              studentId: student.id,
              amount: -price,
              paymentMethod: PaymentType.cash,
              comment,
            },
          }),
        ]);

        if (Number(updatedStudent.balance) < 0 && student.parentChatId) {
          this.telegramService
            .sendDebtAlert(
              student.parentChatId,
              student.fullName,
              Number(updatedStudent.balance),
              group.name,
            )
            .catch((e) => this.logger.error(`Telegram qarzdorlik xabari xatosi: ${e.message}`));
        }

        if (Number(updatedStudent.balance) < 0 && student.parentPhone) {
          this.smsService
            .sendDebtAlert(
              student.parentPhone,
              student.fullName,
              Number(updatedStudent.balance),
              group.name,
            )
            .catch((e) => this.logger.error(`SMS qarzdorlik xabari xatosi: ${e.message}`));
        }

        count++;
        totalCharged += price;
      }
    }

    return {
      success: true,
      count,
      skipped,
      totalCharged,
      message:
        `${count} ta o'quvchidan jami ${totalCharged.toLocaleString()} so'm oylik to'lov yechildi` +
        (skipped > 0 ? ` (${skipped} ta o'quvchidan bu oy uchun avval yechilgan — o'tkazib yuborildi)` : ''),
    };
  }

  async findAll(studentId?: string, centerId?: string) {
    return this.prisma.payment.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(centerId ? { student: { centerId } } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('To\'lov topilmadi');
    }

    return payment;
  }

  // ==========================================
  // CLICK INTEGRATSIYASI (WEBHOOK)
  // ==========================================

  /**
   * Click imzosini tekshirish:
   * md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
   *     + [merchant_prepare_id — faqat complete uchun] + amount + action + sign_time)
   * CLICK_SECRET_KEY sozlanmagan bo'lsa webhook umuman qabul qilinmaydi —
   * aks holda istalgan odam soxta "to'lov o'tdi" so'rovi bilan balansni oshira olardi.
   */
  private verifyClickSign(data: any, isComplete: boolean): boolean {
    const secret = this.configService.get<string>('CLICK_SECRET_KEY');
    if (!secret) {
      this.logger.warn('Click webhook rad etildi: CLICK_SECRET_KEY sozlanmagan');
      return false;
    }
    const serviceId = this.configService.get<string>('CLICK_SERVICE_ID');
    if (serviceId && String(data?.service_id) !== String(serviceId)) return false;

    const expected = this.md5(
      `${data?.click_trans_id}${data?.service_id}${secret}${data?.merchant_trans_id}` +
        (isComplete ? `${data?.merchant_prepare_id}` : '') +
        `${data?.amount}${data?.action}${data?.sign_time}`,
    );
    return this.safeEqual(expected, data?.sign_string);
  }

  private clickError(data: any, error: number, note: string) {
    return {
      click_trans_id: data?.click_trans_id,
      merchant_trans_id: data?.merchant_trans_id,
      error,
      error_note: note,
    };
  }

  async clickPrepare(data: any) {
    if (!this.verifyClickSign(data, false)) {
      return this.clickError(data, -1, 'SIGN CHECK FAILED!');
    }

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return this.clickError(data, -2, 'Incorrect parameter amount');
    }

    // 1. O'quvchini (merchant_trans_id orqali) tekshirish
    const student = await this.prisma.student.findUnique({
      where: { id: String(data.merchant_trans_id) },
    });

    if (!student) {
      this.logger.warn(`Click Prepare: O'quvchi topilmadi (ID: ${data.merchant_trans_id})`);
      return this.clickError(data, -5, "O'quvchi topilmadi");
    }

    return {
      click_trans_id: data.click_trans_id,
      merchant_trans_id: data.merchant_trans_id,
      merchant_prepare_id: Date.now(),
      error: 0,
      error_note: 'Success',
    };
  }

  async clickComplete(data: any) {
    if (!this.verifyClickSign(data, true)) {
      return this.clickError(data, -1, 'SIGN CHECK FAILED!');
    }

    // Agar to'lov bekor qilingan bo'lsa
    if (data.error && Number(data.error) < 0) {
      return this.clickError(data, -9, 'Bekor qilingan');
    }

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return this.clickError(data, -2, 'Incorrect parameter amount');
    }

    // 1. O'quvchini tekshirish
    const student = await this.prisma.student.findUnique({
      where: { id: String(data.merchant_trans_id) },
    });

    if (!student) {
      return this.clickError(data, -5, "O'quvchi topilmadi");
    }

    // 2. Click bitta tranzaksiya uchun webhookni qayta yuborishi mumkin —
    //    ikkinchi marta balans oshirilmaydi.
    const ref = `click-${data.click_trans_id}`;
    const duplicate = await this.findByExternalRef(student.id, ref);
    if (duplicate) {
      return this.clickError(data, -4, 'Already paid');
    }

    // 3. To'lovni bazaga yozish va balansni oshirish
    try {
      await this.create({
        studentId: student.id,
        amount,
        paymentMethod: 'click',
        comment: `Click orqali to'lov (Tr: ${ref})`,
      });

      this.logger.log(`Click Complete: ${student.fullName} balansiga ${amount} so'm qo'shildi.`);

      return {
        click_trans_id: data.click_trans_id,
        merchant_trans_id: data.merchant_trans_id,
        merchant_confirm_id: Date.now(),
        error: 0,
        error_note: 'Success',
      };
    } catch (err: any) {
      this.logger.error(`Click Complete Error: ${err.message}`);
      return this.clickError(data, -7, 'Failed to update user');
    }
  }

  // ==========================================
  // ATMOS (PAYNET/UZCARD/HUMO) INTEGRATSIYASI
  // ==========================================

  async createAtmosInvoice(studentId: string, amount: number) {
    if (!studentId || !Number.isFinite(amount) || amount < 1000) {
      throw new BadRequestException("O'quvchi va to'lov summasi (kamida 1 000 so'm) kiritilishi shart");
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException("O'quvchi topilmadi");
    }

    const consumerKey = this.configService.get<string>('ATMOS_CONSUMER_KEY');
    const consumerSecret = this.configService.get<string>('ATMOS_CONSUMER_SECRET');
    const storeId = this.configService.get<string>('ATMOS_STORE_ID');
    const portalUrl = this.configService.get<string>('WEB_APP_URL') || 'https://eduyuz.uz';

    // Kalitlar endi kodda emas, .env da. Sozlanmagan bo'lsa soxta havola qaytarilmaydi.
    if (!consumerKey || !consumerSecret || !storeId) {
      throw new ServiceUnavailableException("Onlayn to'lov (Atmos) hali ulanmagan");
    }

    try {
      const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

      const tokenRes = await fetch('https://apigw.atmos.uz/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      const tokenData: any = await tokenRes.json();
      if (!tokenRes.ok || !tokenData?.access_token) {
        throw new Error('Atmos token olinmadi');
      }

      const invoiceRes = await fetch('https://apigw.atmos.uz/checkout/invoice/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: Date.now().toString(),
          store_id: Number(storeId),
          account: studentId,
          amount: Math.round(amount * 100), // so'mdan tiyinga
          success_url: `${portalUrl}/portal?studentId=${studentId}`,
          items: [
            {
              items_id: '1',
              name: "O'quv kursi to'lovi",
              amount: Math.round(amount * 100),
              details: [],
            },
          ],
        }),
      });
      const invoiceData: any = await invoiceRes.json();
      if (!invoiceRes.ok || !invoiceData?.url) {
        throw new Error('Atmos invoys yaratilmadi');
      }

      this.logger.log(`Atmos orqali invoys yaratildi: ${amount} so'm (${student.fullName})`);
      return { url: invoiceData.url };
    } catch (err: any) {
      this.logger.error(`Atmos Invoice Error: ${err.message}`);
      throw new ServiceUnavailableException("Atmos xizmatiga ulanib bo'lmadi");
    }
  }

  async atmosCallback(data: any, signature: string) {
    const apiKey = this.configService.get<string>('ATMOS_API_KEY');

    // Imzo tekshiruvi avval izohga olib qo'yilgan edi — ya'ni istalgan odam bu manzilga
    // so'rov yuborib, istalgan o'quvchi balansini oshira olardi. Endi majburiy.
    if (!apiKey) {
      this.logger.warn('Atmos callback rad etildi: ATMOS_API_KEY sozlanmagan');
      return { status: 0, message: "To'lov tizimi sozlanmagan" };
    }

    // formula: store_id+transaction_id+invoice+amount+api_key
    const expectedSign = this.md5(
      `${data?.store_id}${data?.transaction_id}${data?.invoice}${data?.amount}${apiKey}`,
    );
    if (!this.safeEqual(expectedSign, signature)) {
      this.logger.warn(`Atmos callback: imzo xato (Tr: ${data?.transaction_id})`);
      return { status: 0, message: 'Imzo xato' };
    }

    const amount = Number(data.amount) / 100; // Tiyindan so'mga
    if (!Number.isFinite(amount) || amount <= 0) {
      return { status: 0, message: "Summa noto'g'ri" };
    }

    const student = await this.prisma.student.findUnique({
      where: { id: String(data.account || data.invoice) },
    });

    if (!student) {
      return { status: 0, message: "O'quvchi topilmadi" };
    }

    // Callback qayta kelsa balans ikki marta oshmasligi kerak
    const ref = `atmos-${data.transaction_id}`;
    if (await this.findByExternalRef(student.id, ref)) {
      return { status: 1, message: 'Muvaffaqiyatli' };
    }

    // To'lovni bazaga yozish
    await this.create({
      studentId: student.id,
      amount,
      paymentMethod: 'card',
      comment: `Atmos/Paynet orqali to'lov (Tr: ${ref})`,
    });

    this.logger.log(`Atmos Callback: ${student.fullName} balansiga ${amount} so'm qo'shildi.`);

    return {
      status: 1,
      message: 'Muvaffaqiyatli',
    };
  }
}
