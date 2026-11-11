import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { AiService } from '../ai/ai.service';
import { SubmitGameDto } from './dto/submit-game.dto';

const GAME_REWARD_PREFIX = "🎮 O'yin yutug'i:";

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

    if (dto.correctCount > dto.totalQuestions) {
      throw new BadRequestException("To'g'ri javoblar soni savollar sonidan ko'p bo'lishi mumkin emas");
    }

    // Natija brauzerdan keladi va uni soxtalashtirish mumkin, shuning uchun kunlik chegara:
    // bir o'quvchi kuniga ko'pi bilan DAILY_REWARDED_GAMES ta o'yin uchun tanga oladi.
    // (Avval bu endpointni skript bilan cheksiz chaqirib, reytingni to'ldirish mumkin edi.)
    const DAILY_REWARDED_GAMES = 5;
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const rewardedToday = await this.prisma.coinTransaction.count({
      where: {
        studentId: dto.studentId,
        createdAt: { gte: dayStart },
        reason: { startsWith: GAME_REWARD_PREFIX },
      },
    });

    const accuracyPercent =
      dto.totalQuestions > 0 ? Math.round((dto.correctCount / dto.totalQuestions) * 100) : 0;

    if (rewardedToday >= DAILY_REWARDED_GAMES) {
      return {
        success: true,
        earnedCoins: 0,
        newCoinBalance: student.coins,
        newPoints: student.points,
        accuracy: accuracyPercent,
        message: `Bugungi o'yin mukofotlari limiti (${DAILY_REWARDED_GAMES} ta) tugadi. Ertaga yana tanga yutishingiz mumkin! 🎮`,
      };
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
    if (dto.comboStreak && dto.comboStreak >= 3 && dto.comboStreak <= dto.correctCount) {
      earnedCoins += 5; // +5 ekstra "On Fire" combo bonusi!
    }

    // Tangalarni talabaga biriktirish
    const updated = await this.gamificationService.awardCoins({
      studentId: dto.studentId,
      amount: earnedCoins,
      reason: `${GAME_REWARD_PREFIX} "${dto.topic}" (${dto.correctCount}/${dto.totalQuestions} to'g'ri)`.slice(0, 150),
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
