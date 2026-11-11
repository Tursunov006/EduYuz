import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { GenerateLessonDto, GenerateQuizDto, AiChatDto, GenerateMarketingDto } from './dto/ai.dto';
import { Public } from '../../common/decorators/public.decorator';

// AI so'rovlari pullik (Gemini). O'qituvchi vositalari login talab qiladi;
// faqat o'quvchi repetitori (portal) ochiq va unga qattiq so'rov chegarasi qo'yilgan.
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('generate-lesson')
  async generateLesson(@Body() dto: GenerateLessonDto) {
    return this.aiService.generateLessonPlan(dto.topic, dto.courseTitle, dto.level);
  }

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('generate-quiz')
  async generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.aiService.generateQuiz(dto.topic, dto.count || 5);
  }

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Get('match-cards')
  async getMatchCards(@Query('topic') topic: string) {
    return this.aiService.generateMatchCards(String(topic || 'Dasturlash asoslari').slice(0, 100));
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @Post('chat')
  async chat(@Body() dto: AiChatDto) {
    const reply = await this.aiService.chatTutor(dto.message, dto.studentName, dto.topic);
    return { reply };
  }

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('marketing')
  async generateMarketing(@Body() dto: GenerateMarketingDto) {
    return this.aiService.generateMarketingContent(dto.platform, dto.topic);
  }
}
