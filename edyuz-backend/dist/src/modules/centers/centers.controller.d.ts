import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { UpdateCenterStatusDto, ResetDirectorPasswordDto } from './dto/center-admin.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class CentersController {
    private readonly centersService;
    private readonly access;
    constructor(centersService: CentersService, access: AccessService);
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
    findAll(user: AuthUser): Promise<({
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
    findOne(id: string, user: AuthUser): Promise<{
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
    update(id: string, dto: UpdateCenterDto, user: AuthUser): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
    updateStatus(id: string, dto: UpdateCenterStatusDto): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
    resetPassword(id: string, dto: ResetDirectorPasswordDto): Promise<{
        success: boolean;
        login: string;
        password: string;
        message: string;
    }>;
    remove(id: string, user: AuthUser): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
        trialEndsAt: Date | null;
        subscriptionStatus: string;
    }>;
}
