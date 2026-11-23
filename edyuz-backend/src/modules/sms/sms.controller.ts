import { Controller, Get, Post, Body, ServiceUnavailableException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoleType } from '@prisma/client';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { Roles } from '../../common/decorators/roles.decorator';

// SMS yuborish pullik xizmat: faqat admin va daqiqasiga cheklangan miqdorda.
// Avval login'siz ochiq edi — istalgan odam markaz hisobidan istalgan raqamga SMS yubora olardi.
@Roles(RoleType.admin)
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('send')
  async sendSms(@Body() dto: SendSmsDto) {
    const res = await this.smsService.sendSms(dto.phone, dto.message);
    if (!res.success) {
      // Frontend "SMS yuborildi" deb yolg'on ko'rsatmasligi uchun xato qaytariladi
      throw new ServiceUnavailableException(
        res.status === 'not_configured'
          ? "SMS xizmati hali sozlanmagan (Eskiz hisobi ulanmagan)"
          : `SMS yuborilmadi: ${res.error || 'noma\'lum xato'}`,
      );
    }
    return res;
  }

  // SMS xizmati ulanganmi va hisobda qancha SMS qolgani
  @Get('status')
  status() {
    return this.smsService.getStatus();
  }

  // Jurnalda barcha markazlarning ota-ona raqamlari bor (jadvalda markaz ustuni yo'q),
  // shuning uchun to'liq jurnal faqat superadmin uchun.
  @Roles(RoleType.superadmin)
  @Get('logs')
  getLogs() {
    return this.smsService.getLogs();
  }
}
