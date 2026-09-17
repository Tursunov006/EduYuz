import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Public()
  @Post('send-test')
  async sendTestMessage(
    @Body('chatId') chatId: string,
    @Body('message') message: string,
  ) {
    const success = await this.telegramService.sendMessage(
      chatId,
      message || '🔔 EdYuz platformasidan sinov xabari!',
    );
    return { success, message: success ? 'Xabar yuborildi' : 'Xabar yuborishda xatolik' };
  }
}
