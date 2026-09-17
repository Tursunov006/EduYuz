import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { AiService } from '../ai/ai.service';
import { SubmitGameDto } from './dto/submit-game.dto';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
    private aiService: AiService,
  ) {}

  // 1. O'yin kontentini olish (AI orqali jonli generatsiya yoki tayyor)
  async getGameContent(topic: string, gameType: string = 'quiz') {
    const cleanTopic = topic?.trim() || 'Dasturlash asoslari';

    if (gameType === 'match') {
      const cards = await this.aiService.generateMatchCards(cleanTopic);
      return {
        topic: cleanTopic,
        gameType: 'match',
        cards,
      };
    }

    // Default: Kahoot uslubidagi viktorina
    const questions = await this.aiService.generateQuiz(cleanTopic, 5);
    return {
      topic: cleanTopic,
      gameType: 'quiz',
      questions,
    };
  }

  // 2. O'yin natijasini saqlash va EduCoin mukofoti berish
  async submitScore(dto: SubmitGameDto) {
    this.logger.log(
      `O'yin natijasi: Student ${dto.studentId}, Topic: "${dto.topic}", Score: ${dto.score}, To'g'ri: ${dto.correctCount}/${dto.totalQuestions}`,
    );

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new NotFoundException('O\'quvchi topilmadi');
    }

    // Tangalar hisoblash mantig'i:
    // To'liq to'g'ri topsa -> 25 coin
    // 80% to'g'ri topsa -> 20 coin
    // 60% to'g'ri topsa -> 15 coin
    // Qatnashganlik uchun -> 5 coin
    const accuracy = dto.totalQuestions > 0 ? dto.correctCount / dto.totalQuestions : 0;
    let earnedCoins = 5;

    if (accuracy >= 1) {
      earnedCoins = 25;
    } else if (accuracy >= 0.8) {
      earnedCoins = 20;
    } else if (accuracy >= 0.6) {
      earnedCoins = 15;
    } else if (accuracy >= 0.4) {
      earnedCoins = 10;
    }

    // Combo streak bonusi
    if (dto.comboStreak && dto.comboStreak >= 3) {
      earnedCoins += 5; // +5 ekstra "On Fire" combo bonusi!
    }

    // Tangalarni talabaga biriktirish
    const updated = await this.gamificationService.awardCoins({
      studentId: dto.studentId,
      amount: earnedCoins,
      reason: `🎮 O'yin yutug'i: "${dto.topic}" (${dto.correctCount}/${dto.totalQuestions} to'g'ri)`,
    });

    return {
      success: true,
      earnedCoins,
      newCoinBalance: updated.coins,
      newPoints: updated.points,
      accuracy: Math.round(accuracy * 100),
      message: `Tabriklaymiz! Siz "${dto.topic}" o'yinida ajoyib natija ko'rsatib, +${earnedCoins} EduCoin yutib oldingiz! 🎉`,
    };
  }
}
