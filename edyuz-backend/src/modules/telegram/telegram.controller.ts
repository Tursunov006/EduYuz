import { BadRequestException, Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { RoleType } from '@prisma/client';
import { TelegramService } from './telegram.service';
import { Roles } from '../../common/decorators/roles.decorator';

// Avval ikkala endpoint ham login'siz ochiq edi: istalgan odam bot tokenini o'z botiga
// almashtirib, ota-onalarga ketadigan barcha xabarlarni egallab olishi yoki
// bot nomidan istalgan chatga xabar yuborishi mumkin edi.
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  // Telegram shu manzilga yangi xabarlarni yuboradi (webhook).
  // Faqat Telegram biladigan maxfiy kalit (X-Telegram-Bot-Api-Secret-Token) bilan qabul qilinadi.
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @Post('webhook')
  webhook(@Headers('x-telegram-bot-api-secret-token') secret: string, @Body() update: any) {
    // Diagnostika: har bir so'rov logga yoziladi (kim yuborgani va qabul qilingani)
    console.log(
      `[TelegramWebhook] so'rov keldi: secret=${secret ? 'bor' : 'yo‘q'}, update_id=${update?.update_id ?? '-'}, ` +
        `type=${update?.message ? 'message' : update?.callback_query ? 'callback' : Object.keys(update || {}).join(',')}`,
    );
    if (!this.telegramService.isValidWebhookSecret(secret)) {
      console.warn('[TelegramWebhook] RAD ETILDI: maxfiy kalit mos kelmadi');
      throw new UnauthorizedException();
    }
    this.telegramService.handleWebhookUpdate(update);
    return { ok: true };
  }

  @Roles(RoleType.admin)
  @Post('send-test')
  async sendTestMessage(
    @Body('chatId') chatId: string,
    @Body('message') message: string,
  ) {
    if (!chatId || !/^-?\d{1,20}$/.test(String(chatId))) {
      throw new BadRequestException("chatId noto'g'ri");
    }
    const success = await this.telegramService.sendMessage(
      chatId,
      String(message || '🔔 EduYuz platformasidan sinov xabari!').slice(0, 1000),
    );
    return { success, message: success ? 'Xabar yuborildi' : 'Xabar yuborishda xatolik' };
  }

  @Roles(RoleType.superadmin)
  @Post('set-token')
  async setBotToken(@Body('token') token: string) {
    return this.telegramService.updateBotToken(token);
  }
}
