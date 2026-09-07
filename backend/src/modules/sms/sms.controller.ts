import { Controller, Get, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  sendSms(@Body() dto: SendSmsDto) {
    return this.smsService.sendSms(dto.phone, dto.message);
  }

  @Get('logs')
  getLogs() {
    return this.smsService.getLogs();
  }
}
