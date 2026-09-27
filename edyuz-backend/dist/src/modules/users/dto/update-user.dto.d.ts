import { RoleType } from '@prisma/client';
export declare class UpdateUserDto {
    fullName?: string;
    phone?: string;
    password?: string;
    role?: RoleType;
    isActive?: boolean;
}
