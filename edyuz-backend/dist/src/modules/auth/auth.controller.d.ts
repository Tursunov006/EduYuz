import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        user: {
            trialEndsAt: any;
            subscriptionStatus: any;
            id: string;
            fullName: string;
            phone: string;
            role: import(".prisma/client").$Enums.RoleType;
            isActive: boolean;
            createdAt: Date;
            centerId: string;
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
            trialEndsAt: any;
            subscriptionStatus: any;
        };
        accessToken: string;
    }>;
    getProfile(user: any): {
        success: boolean;
        user: any;
    };
}
