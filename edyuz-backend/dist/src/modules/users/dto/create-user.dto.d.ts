import { RoleType } from '@prisma/client';
export declare class CreateUserDto {
    centerId: string;
    fullName: string;
    phone: string;
    password: string;
    role?: RoleType;
    isActive?: boolean;
}
