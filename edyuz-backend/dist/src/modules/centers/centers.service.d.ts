import { PrismaService } from '../prisma/prisma.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
export declare class CentersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCenterDto): Promise<{
        directorLogin: string;
        directorPassword: string;
        directorNote: string;
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
    findAll(onlyCenterId?: string): Promise<({
        _count: {
            users: number;
            courses: number;
            groups: number;
            students: number;
        };
    } & {
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            users: number;
            courses: number;
            groups: number;
            students: number;
        };
    } & {
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
    update(id: string, dto: UpdateCenterDto): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
    updateStatus(id: string, status: 'active' | 'trial' | 'expired', daysToAdd?: number): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
    resetDirectorPassword(id: string, requestedPassword?: string): Promise<{
        success: boolean;
        login: string;
        password: string;
        message: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
}
