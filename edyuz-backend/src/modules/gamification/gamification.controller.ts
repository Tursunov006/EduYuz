import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AwardCoinsDto } from './dto/award-coins.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Public()
  @Get('leaderboard')
  async getLeaderboard(@Query('groupId') groupId?: string) {
    return this.gamificationService.getLeaderboard(groupId);
  }

  @Public()
  @Post('award')
  async awardCoins(@Body() dto: AwardCoinsDto) {
    return this.gamificationService.awardCoins(dto);
  }

  @Public()
  @Get('student/:id/history')
  async getStudentHistory(@Param('id') id: string) {
    return this.gamificationService.getStudentHistory(id);
  }
}
