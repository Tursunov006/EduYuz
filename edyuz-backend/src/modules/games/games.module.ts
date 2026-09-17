import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [GamificationModule, AiModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
