import { GamificationService } from './gamification.service';
import { AwardCoinsDto } from './dto/award-coins.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class GamificationController {
    private readonly gamificationService;
    private readonly access;
    constructor(gamificationService: GamificationService, access: AccessService);
    getLeaderboard(user: AuthUser, groupId?: string): Promise<{
        rank: number;
        id: string;
        fullName: string;
        coins: number;
        points: number;
        groupName: string;
        courseTitle: string;
    }[]>;
    awardCoins(dto: AwardCoinsDto, user: AuthUser): Promise<{
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
    getStudentHistory(id: string, user?: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        amount: number;
        studentId: string;
        reason: string;
    }[]>;
}
