import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class UsersController {
    private readonly usersService;
    private readonly access;
    constructor(usersService: UsersService, access: AccessService);
    private assertRoleAllowed;
    create(dto: CreateUserDto, user: AuthUser): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        isActive: boolean;
    }>;
    findAll(user: AuthUser, centerId?: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        isActive: boolean;
    }[]>;
    findOne(id: string, user: AuthUser): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        isActive: boolean;
    }>;
    update(id: string, dto: UpdateUserDto, user: AuthUser): Promise<{
        id: string;
        phone: string;
        centerId: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
        isActive: boolean;
    }>;
    remove(id: string, user: AuthUser): Promise<{
        id: string;
        phone: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleType;
    }>;
}
