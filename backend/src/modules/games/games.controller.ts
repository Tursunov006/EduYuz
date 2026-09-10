import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { SubmitGameDto } from './dto/submit-game.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('content')
  async getGameContent(
    @Query('topic') topic: string,
    @Query('type') type: string,
  ) {
    return this.gamesService.getGameContent(topic, type);
  }

  @Post('submit-score')
  async submitScore(@Body() dto: SubmitGameDto) {
    return this.gamesService.submitScore(dto);
  }
}
