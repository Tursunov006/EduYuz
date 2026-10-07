import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
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
    private generateToken;
}
