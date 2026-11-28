import { Global, Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { StaffBotService } from './staff-bot.service';
import { TelegramController } from './telegram.controller';
import { AiModule } from '../ai/ai.module';

@Global()
@Module({
  imports: [AiModule],
  controllers: [TelegramController],
  providers: [TelegramService, StaffBotService],
  exports: [TelegramService, StaffBotService],
})
export class TelegramModule {}
