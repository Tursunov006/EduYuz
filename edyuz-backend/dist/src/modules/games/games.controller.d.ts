import { GamesService } from './games.service';
import { SubmitGameDto } from './dto/submit-game.dto';
export declare class GamesController {
    private readonly gamesService;
    constructor(gamesService: GamesService);
    getGameContent(topic: string, type: string): Promise<{
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
