import { RoleType } from '@prisma/client';
export declare class RegisterDto {
    centerId: string;
    fullName: string;
    phone: string;
    password: string;
    role?: RoleType;
}
