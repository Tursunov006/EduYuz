import { GamificationService } from './gamification.service';
import { AwardCoinsDto } from './dto/award-coins.dto';
export declare class GamificationController {
    private readonly gamificationService;
    constructor(gamificationService: GamificationService);
    getLeaderboard(groupId?: string): Promise<{
        rank: number;
        id: string;
        fullName: string;
        coins: number;
        points: number;
        groupName: string;
        courseTitle: string;
    }[]>;
    awardCoins(dto: AwardCoinsDto): Promise<{
        id: string;
        phone: string | null;
        createdAt: Date;
        centerId: string;
        fullName: string;
        parentPhone: string;
        parentChatId: bigint | null;
        balance: import("@prisma/client/runtime/library").Decimal;
        coins: number;
        points: number;
        status: import(".prisma/client").$Enums.StudentStatus;
    }>;
    getStudentHistory(id: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        amount: number;
        reason: string;
    }[]>;
}
