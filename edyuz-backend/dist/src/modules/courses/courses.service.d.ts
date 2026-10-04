import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
export declare class CoursesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCourseDto): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        centerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(centerId?: string): Promise<({
        _count: {
            groups: number;
        };
    } & {
        id: string;
        title: string;
        createdAt: Date;
        centerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findOne(id: string): Promise<{
        groups: ({
            teacher: {
                id: string;
                fullName: string;
                phone: string;
            };
        } & {
            id: string;
            createdAt: Date;
            centerId: string;
            name: string;
            courseId: string;
            teacherId: string;
            days: import("@prisma/client/runtime/library").JsonValue;
            startTime: string;
            endTime: string;
        })[];
    } & {
        id: string;
        title: string;
        createdAt: Date;
        centerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateCourseDto): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        centerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        centerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
    }>;
}
