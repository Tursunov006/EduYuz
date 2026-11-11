import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { TelegramService } from './telegram.service';
import { Roles } from '../../common/decorators/roles.decorator';

// Avval ikkala endpoint ham login'siz ochiq edi: istalgan odam bot tokenini o'z botiga
// almashtirib, ota-onalarga ketadigan barcha xabarlarni egallab olishi yoki
// bot nomidan istalgan chatga xabar yuborishi mumkin edi.
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

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
