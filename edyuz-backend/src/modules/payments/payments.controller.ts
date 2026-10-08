import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Public()
  @Post('charge-monthly')
  chargeMonthly(@Body('groupId') groupId?: string) {
    return this.paymentsService.chargeMonthly(groupId);
  }

  @Public()
  @Get()
  findAll(@Query('studentId') studentId?: string) {
    return this.paymentsService.findAll(studentId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  // ==========================================
  // TEMPORARY RESET (For Presentation)
  // ==========================================
  @Public()
  @Post('reset-all-data')
  async resetAll() {
    return this.paymentsService.resetAllPayments();
  }

  // ==========================================
  // CLICK WEBHOOKS (Public APIs)
  // ==========================================
  
  @Public()
  @Post('click/prepare')
  clickPrepare(@Body() data: any) {
    return this.paymentsService.clickPrepare(data);
  }

  @Public()
  @Post('click/complete')
  clickComplete(@Body() data: any) {
    return this.paymentsService.clickComplete(data);
  }

  // ==========================================
  // ATMOS WEBHOOKS & API (Public APIs)
  // ==========================================

  @Public()
  @Post('atmos/create-invoice')
  createAtmosInvoice(@Body() body: { studentId: string; amount: number }) {
    return this.paymentsService.createAtmosInvoice(body.studentId, body.amount);
  }

  @Public()
  @Post('atmos/callback')
  atmosCallback(@Body() data: any, @Query('sign') sign: string) {
    return this.paymentsService.atmosCallback(data, sign || '');
  }
}
