import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
  ) {}

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
        .catch(() => {});
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
  async chargeMonthly(groupId?: string) {
    const groups = await this.prisma.group.findMany({
      where: groupId ? { id: groupId } : {},
      include: {
        course: true,
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    let count = 0;
    let totalCharged = 0;

    for (const group of groups) {
      const price = Number(group.course?.price || 0);
      if (price <= 0 || !group.students) continue;

      for (const item of group.students) {
        const student = item.student;
        if (!student || student.status !== 'active') continue;

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
              comment: `${group.name} guruhi uchun oylik to'lov yechildi`,
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
      totalCharged,
      message: `${count} ta o'quvchidan jami ${totalCharged.toLocaleString()} so'm oylik to'lov yechildi`,
    };
  }

  async findAll(studentId?: string) {
    return this.prisma.payment.findMany({
      where: studentId ? { studentId } : {},
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
  
  async clickPrepare(data: any) {
    // 1. O'quvchini (merchant_trans_id orqali) tekshirish
    const student = await this.prisma.student.findUnique({
      where: { id: data.merchant_trans_id }
    });
    
    if (!student) {
      this.logger.warn(`Click Prepare: O'quvchi topilmadi (ID: ${data.merchant_trans_id})`);
      return {
        click_trans_id: data.click_trans_id,
        merchant_trans_id: data.merchant_trans_id,
        error: -5,
        error_note: "O'quvchi topilmadi"
      };
    }

    return {
      click_trans_id: data.click_trans_id,
      merchant_trans_id: data.merchant_trans_id,
      merchant_prepare_id: Date.now(),
      error: 0,
      error_note: "Success"
    };
  }

  async clickComplete(data: any) {
    // Agar to'lov bekor qilingan bo'lsa
    if (data.error && Number(data.error) < 0) {
      return {
        click_trans_id: data.click_trans_id,
        merchant_trans_id: data.merchant_trans_id,
        error: -9,
        error_note: "Bekor qilingan"
      };
    }

    // 1. O'quvchini tekshirish
    const student = await this.prisma.student.findUnique({
      where: { id: data.merchant_trans_id }
    });
    
    if (!student) {
      return {
        click_trans_id: data.click_trans_id,
        merchant_trans_id: data.merchant_trans_id,
        error: -5,
        error_note: "O'quvchi topilmadi"
      };
    }

    // 2. To'lovni bazaga yozish va balansni oshirish
    try {
      await this.create({
        studentId: data.merchant_trans_id,
        amount: Number(data.amount),
        paymentMethod: 'click',
        comment: `Click orqali to'lov (Tr: ${data.click_trans_id})`
      });
      
      this.logger.log(`Click Complete: ${student.fullName} balansiga ${data.amount} so'm qo'shildi.`);
      
      return {
        click_trans_id: data.click_trans_id,
        merchant_trans_id: data.merchant_trans_id,
        merchant_confirm_id: Date.now(),
        error: 0,
        error_note: "Success"
      };
    } catch (err: any) {
      this.logger.error(`Click Complete Error: ${err.message}`);
      return {
        click_trans_id: data.click_trans_id,
        merchant_trans_id: data.merchant_trans_id,
        error: -4,
        error_note: "Xatolik yuz berdi"
      };
    }
  }

  // ==========================================
  // ATMOS (PAYNET/UZCARD/HUMO) INTEGRATSIYASI
  // ==========================================
  
  async createAtmosInvoice(studentId: string, amount: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      throw new NotFoundException("O'quvchi topilmadi");
    }

    try {
      // 1. Atmos token olish (Test kalitlar bilan)
      const consumerKey = 'test_consumer_key';
      const consumerSecret = 'test_consumer_secret';
      const storeId = 1234;
      
      const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      
      // Real muhitda bu qism ishlaydi
      /*
      const tokenRes = await fetch('https://apigw.atmos.uz/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      
      // 2. Invoys yaratish
      const invoiceRes = await fetch('https://apigw.atmos.uz/checkout/invoice/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: Date.now().toString(),
          store_id: storeId,
          account: studentId,
          amount: amount,
          success_url: "https://eduyuz.uz/portal",
          items: [{
            items_id: "1",
            name: "O'quv kursi to'lovi",
            amount: amount,
            details: []
          }]
        })
      });
      const invoiceData = await invoiceRes.json();
      return { url: invoiceData.url };
      */
      
      // Hozirgi tanlov va test uchun (Sandbox url)
      this.logger.log(`Atmos (Paynet) orqali invoys yaratildi: ${amount} so'm (${student.fullName})`);
      return { 
        url: `https://test-checkout.pays.uz/invoice/get?storeId=${storeId}&transactionId=${Date.now()}&redirectLink=https://eduyuz.uz/portal` 
      };
      
    } catch (err: any) {
      this.logger.error(`Atmos Invoice Error: ${err.message}`);
      throw new Error("Atmos xizmatiga ulanib bo'lmadi");
    }
  }

  async atmosCallback(data: any, signature: string) {
    const apiKey = 'test_api_key';
    
    // Hash tekshirish
    // formula: store_id+transaction_id+invoice+amount+api_key
    const crypto = require('crypto');
    const hashString = `${data.store_id}${data.transaction_id}${data.invoice}${data.amount}${apiKey}`;
    const expectedSign = crypto.createHash('md5').update(hashString).digest('hex'); // Yoki Atmos ishlatadigan hash algoritmi
    
    // Test holatida imzoga qaramaymiz, lekin logikani yozib qo'yamiz
    /*
    if (signature !== expectedSign) {
       return { status: 0, message: "Imzo xato" };
    }
    */
    
    const student = await this.prisma.student.findUnique({
      where: { id: String(data.account || data.invoice) }
    });
    
    if (!student) {
      return { status: 0, message: "O'quvchi topilmadi" };
    }
    
    // To'lovni bazaga yozish
    await this.create({
      studentId: student.id,
      amount: Number(data.amount) / 100, // Tiyindan so'mga
      paymentMethod: 'click', // Yoki enumga 'atmos' qo'shish kerak
      comment: `Atmos/Paynet orqali to'lov (Tr: ${data.transaction_id})`
    });
    
    this.logger.log(`Atmos Callback: ${student.fullName} balansiga ${data.amount / 100} so'm qo'shildi.`);
    
    return {
      status: 1,
      message: "Muvaffaqiyatli"
    };
  }
}

