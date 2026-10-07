import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
export declare class CentersController {
    private readonly centersService;
    constructor(centersService: CentersService);
    create(dto: CreateCenterDto): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        name: string;
    }>;
    findAll(): Promise<({
        _count: {
            groups: number;
            users: number;
            courses: number;
            students: number;
        };
    } & {
        id: string;
        phone: string;
        createdAt: Date;
        name: string;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            groups: number;
            users: number;
            courses: number;
            students: number;
        };
    } & {
        id: string;
        phone: string;
        createdAt: Date;
        name: string;
    }>;
    update(id: string, dto: UpdateCenterDto): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        name: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        name: string;
    }>;
}
