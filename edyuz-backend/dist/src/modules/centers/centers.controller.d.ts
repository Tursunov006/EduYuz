import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
export declare class CentersController {
    private readonly centersService;
    constructor(centersService: CentersService);
    create(dto: CreateCenterDto): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
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
    }>;
    update(id: string, dto: UpdateCenterDto): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        phone: string;
        createdAt: Date;
    }>;
}
