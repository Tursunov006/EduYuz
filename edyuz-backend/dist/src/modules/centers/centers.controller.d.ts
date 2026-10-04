import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
export declare class CentersController {
    private readonly centersService;
    constructor(centersService: CentersService);
    create(dto: CreateCenterDto): Promise<{
        id: string;
        createdAt: Date;
        phone: string;
        name: string;
    }>;
    findAll(): Promise<({
        _count: {
            groups: number;
            students: number;
            users: number;
            courses: number;
        };
    } & {
        id: string;
        createdAt: Date;
        phone: string;
        name: string;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            groups: number;
            students: number;
            users: number;
            courses: number;
        };
    } & {
        id: string;
        createdAt: Date;
        phone: string;
        name: string;
    }>;
    update(id: string, dto: UpdateCenterDto): Promise<{
        id: string;
        createdAt: Date;
        phone: string;
        name: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        phone: string;
        name: string;
    }>;
}
