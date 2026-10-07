import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        isActive: boolean;
    }>;
    findAll(centerId?: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        isActive: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        isActive: boolean;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        phone: string;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.RoleType;
        specialty: string | null;
        salaryType: string;
        salaryRate: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
}
