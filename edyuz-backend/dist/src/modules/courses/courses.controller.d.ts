import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    create(dto: CreateCourseDto): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(centerId?: string): Promise<({
        _count: {
            groups: number;
        };
    } & {
        id: string;
        createdAt: Date;
        centerId: string;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findOne(id: string): Promise<{
        groups: ({
            teacher: {
                id: string;
                phone: string;
                fullName: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            centerId: string;
            courseId: string;
            teacherId: string;
            days: import("@prisma/client/runtime/library").JsonValue;
            startTime: string;
            endTime: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        centerId: string;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateCourseDto): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        centerId: string;
        title: string;
        price: import("@prisma/client/runtime/library").Decimal;
    }>;
}
