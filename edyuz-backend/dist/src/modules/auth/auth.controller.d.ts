import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from '../../common/access/access.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, user: AuthUser): Promise<{
        message: string;
        user: {
            trialEndsAt: Date;
            subscriptionStatus: string;
            id: string;
            phone: string;
            createdAt: Date;
            centerId: string;
            fullName: string;
            role: import(".prisma/client").$Enums.RoleType;
            isActive: boolean;
        };
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        user: {
            id: string;
            centerId: string;
            centerName: string;
            fullName: string;
            phone: string;
            role: import(".prisma/client").$Enums.RoleType;
            trialEndsAt: Date;
            subscriptionStatus: string;
        };
        accessToken: string;
    }>;
    getProfile(user: AuthUser): {
        success: boolean;
        user: AuthUser;
    };
}
