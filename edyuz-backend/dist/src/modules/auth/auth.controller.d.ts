import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
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
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        user: {
            id: string;
            centerId: string;
            fullName: string;
            phone: string;
            role: import(".prisma/client").$Enums.RoleType;
            trialEndsAt: Date;
            subscriptionStatus: string;
        };
        accessToken: string;
    }>;
    getProfile(user: any): {
        success: boolean;
        user: any;
    };
}
