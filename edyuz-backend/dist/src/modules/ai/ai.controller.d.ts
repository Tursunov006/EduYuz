import { AiService } from './ai.service';
import { GenerateLessonDto, GenerateQuizDto, AiChatDto, GenerateMarketingDto } from './dto/ai.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    generateLesson(dto: GenerateLessonDto): Promise<any>;
    generateQuiz(dto: GenerateQuizDto): Promise<import("./ai.service").QuizQuestion[]>;
    getMatchCards(topic: string): Promise<import("./ai.service").MatchPair[]>;
    chat(dto: AiChatDto): Promise<{
        reply: string;
    }>;
    generateMarketing(dto: GenerateMarketingDto): Promise<{
        success: boolean;
        data: {
            title: string;
            content: string;
            suggestedHashtags: string;
        };
    }>;
}
