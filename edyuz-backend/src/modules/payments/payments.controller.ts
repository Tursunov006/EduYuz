import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { RoleType } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly access: AccessService,
  ) {}

  // To'lov qabul qilish — faqat admin (kassa). Avval bu endpoint ochiq edi va
  // istalgan odam istalgan o'quvchi balansiga pul "qo'shib" qo'ya olardi.
  @Roles(RoleType.admin)
  @Post()
  async create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    await this.access.student(user, dto.studentId);
    return this.paymentsService.create(dto);
  }

  @Roles(RoleType.admin)
  @Post('charge-monthly')
  async chargeMonthly(@CurrentUser() user: AuthUser, @Body('groupId') groupId?: string) {
    if (groupId) await this.access.group(user, groupId);
    // Superadmin ham faqat o'z markazi bo'yicha yechadi — bir tugma bilan barcha
    // markazlardagi o'quvchilardan pul yechilib ketmasligi uchun.
    return this.paymentsService.chargeMonthly(user.centerId, groupId);
  }

  // Xodim: o'z markazi to'lovlari. Anonim (portal): faqat ko'rsatilgan o'quvchining to'lovlari.
  @Public()
  @Get()
  async findAll(@CurrentUser() user?: AuthUser, @Query('studentId') studentId?: string) {
    if (!user) {
      if (!studentId) {
        throw new BadRequestException('studentId kiritilishi shart');
      }
      return this.paymentsService.findAll(studentId);
    }
    if (studentId) await this.access.student(user, studentId);
    return this.paymentsService.findAll(studentId, this.access.scopeCenter(user));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.payment(user, id);
    return this.paymentsService.findOne(id);
  }

  // "reset-all-data" endpointi olib tashlandi: u login'siz chaqirilganda BARCHA
  // markazlarning to'lovlar tarixini o'chirib, balanslarni nolga tushirardi.

  // ==========================================
  // CLICK WEBHOOKS (imzo servisda tekshiriladi)
  // ==========================================

  @Public()
  @SkipThrottle()
  @Post('click/prepare')
  clickPrepare(@Body() data: any) {
    return this.paymentsService.clickPrepare(data);
  }

  @Public()
  @SkipThrottle()
  @Post('click/complete')
  clickComplete(@Body() data: any) {
    return this.paymentsService.clickComplete(data);
  }

  // ==========================================
  // ATMOS WEBHOOKS & API
  // ==========================================

  @Public()
  @Post('atmos/create-invoice')
  createAtmosInvoice(@Body() body: { studentId: string; amount: number }) {
    return this.paymentsService.createAtmosInvoice(body?.studentId, Number(body?.amount));
  }

  @Public()
  @SkipThrottle()
  @Post('atmos/callback')
  atmosCallback(@Body() data: any, @Query('sign') sign: string) {
    return this.paymentsService.atmosCallback(data, sign || data?.sign || '');
  }
}
