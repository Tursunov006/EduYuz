import { AuthUser } from '../../common/access/access.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto, actor: AuthUser): Promise<{
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
    private generateToken;
}
