import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GamesService } from './games.service';
import { SubmitGameDto } from './dto/submit-game.dto';
import { Public } from '../../common/decorators/public.decorator';

// O'quvchi o'yinlari portal orqali login'siz ochiladi, shuning uchun bu yerda
// qattiqroq so'rov chegarasi qo'yilgan (AI generatsiya pullik resurs).
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @Get('content')
  async getGameContent(
    @Query('topic') topic: string,
    @Query('type') type: string,
  ) {
    return this.gamesService.getGameContent(String(topic || '').slice(0, 100), type);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('submit-score')
  async submitScore(@Body() dto: SubmitGameDto) {
    return this.gamesService.submitScore(dto);
  }
}
