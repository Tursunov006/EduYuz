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
}
