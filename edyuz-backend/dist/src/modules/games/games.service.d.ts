import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { AiService } from '../ai/ai.service';
import { SubmitGameDto } from './dto/submit-game.dto';
export declare class GamesService {
    private prisma;
    private gamificationService;
    private aiService;
    private readonly logger;
    constructor(prisma: PrismaService, gamificationService: GamificationService, aiService: AiService);
    getGameContent(topic: string, gameType?: string): Promise<{
        topic: string;
        gameType: string;
        cards: import("../ai/ai.service").MatchPair[];
        questions?: undefined;
    } | {
        topic: string;
        gameType: string;
        questions: import("../ai/ai.service").QuizQuestion[];
        cards?: undefined;
    }>;
    submitScore(dto: SubmitGameDto): Promise<{
        success: boolean;
        earnedCoins: number;
        newCoinBalance: number;
        newPoints: number;
        accuracy: number;
        message: string;
    }>;
}
