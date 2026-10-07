import { PrismaService } from '../prisma/prisma.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
export declare class CentersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCenterDto): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
    findAll(): Promise<({
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
    remove(id: string): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
}
