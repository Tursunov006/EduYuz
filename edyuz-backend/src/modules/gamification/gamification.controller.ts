import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AwardCoinsDto } from './dto/award-coins.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly access: AccessService,
  ) {}

  // Reyting faqat xodimning o'z markazi bo'yicha (avval barcha markazlar aralash chiqardi)
  @Get('leaderboard')
  async getLeaderboard(@CurrentUser() user: AuthUser, @Query('groupId') groupId?: string) {
    if (groupId) await this.access.group(user, groupId);
    return this.gamificationService.getLeaderboard(groupId, this.access.scopeCenter(user));
  }

  // Tanga berish/yechish — faqat xodimlar (avval ochiq edi)
  @Post('award')
  async awardCoins(@Body() dto: AwardCoinsDto, @CurrentUser() user: AuthUser) {
    await this.access.student(user, dto.studentId);
    return this.gamificationService.awardCoins(dto);
  }

  @Public()
  @Get('student/:id/history')
  async getStudentHistory(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    if (user) await this.access.student(user, id);
    return this.gamificationService.getStudentHistory(id);
  }
}
