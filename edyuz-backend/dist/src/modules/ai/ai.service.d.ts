import { ConfigService } from '@nestjs/config';
export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    timeLimitSeconds: number;
    points: number;
}
export interface MatchPair {
    id: string;
    term: string;
    definition: string;
}
export interface ParentBotContext {
    student?: any;
    groupInfo?: any;
    teacher?: any;
    attendances?: any[];
    allCourses?: any[];
    center?: any;
}
export declare class AiService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    generateLessonPlan(topic: string, courseTitle?: string, level?: string): Promise<any>;
    generateQuiz(topic: string, count?: number): Promise<QuizQuestion[]>;
    generateMatchCards(topic: string): Promise<MatchPair[]>;
    chatTutor(message: string, studentName?: string, topic?: string): Promise<string>;
    chatParentBot(message: string, ctx: ParentBotContext): Promise<string>;
    private callExternalAiForLesson;
    private callExternalAiForQuiz;
    private generateSmartLessonFallback;
    private generateSmartQuizFallback;
    private generateSmartMatchFallback;
}
