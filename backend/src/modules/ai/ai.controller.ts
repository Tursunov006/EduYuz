import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateLessonDto, GenerateQuizDto, AiChatDto } from './dto/ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-lesson')
  async generateLesson(@Body() dto: GenerateLessonDto) {
    return this.aiService.generateLessonPlan(dto.topic, dto.courseTitle, dto.level);
  }

  @Post('generate-quiz')
  async generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.aiService.generateQuiz(dto.topic, dto.count || 5);
  }

  @Get('match-cards')
  async getMatchCards(@Query('topic') topic: string) {
    return this.aiService.generateMatchCards(topic || 'Dasturlash asoslari');
  }

  @Post('chat')
  async chat(@Body() dto: AiChatDto) {
    const reply = await this.aiService.chatTutor(dto.message, dto.studentName, dto.topic);
    return { reply };
  }
}
