"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GamesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const gamification_service_1 = require("../gamification/gamification.service");
const ai_service_1 = require("../ai/ai.service");
let GamesService = GamesService_1 = class GamesService {
    constructor(prisma, gamificationService, aiService) {
        this.prisma = prisma;
        this.gamificationService = gamificationService;
        this.aiService = aiService;
        this.logger = new common_1.Logger(GamesService_1.name);
    }
    async getGameContent(topic, gameType = 'quiz') {
        const cleanTopic = topic?.trim() || 'Dasturlash asoslari';
        if (gameType === 'match') {
            const cards = await this.aiService.generateMatchCards(cleanTopic);
            return {
                topic: cleanTopic,
                gameType: 'match',
                cards,
            };
        }
        const questions = await this.aiService.generateQuiz(cleanTopic, 5);
        return {
            topic: cleanTopic,
            gameType: 'quiz',
            questions,
        };
    }
    async submitScore(dto) {
        this.logger.log(`O'yin natijasi: Student ${dto.studentId}, Topic: "${dto.topic}", Score: ${dto.score}, To'g'ri: ${dto.correctCount}/${dto.totalQuestions}`);
        const student = await this.prisma.student.findUnique({
            where: { id: dto.studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('O\'quvchi topilmadi');
        }
        const accuracy = dto.totalQuestions > 0 ? dto.correctCount / dto.totalQuestions : 0;
        let earnedCoins = 5;
        if (accuracy >= 1) {
            earnedCoins = 25;
        }
        else if (accuracy >= 0.8) {
            earnedCoins = 20;
        }
        else if (accuracy >= 0.6) {
            earnedCoins = 15;
        }
        else if (accuracy >= 0.4) {
            earnedCoins = 10;
        }
        if (dto.comboStreak && dto.comboStreak >= 3) {
            earnedCoins += 5;
        }
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
};
exports.GamesService = GamesService;
exports.GamesService = GamesService = GamesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gamification_service_1.GamificationService,
        ai_service_1.AiService])
], GamesService);
//# sourceMappingURL=games.service.js.map