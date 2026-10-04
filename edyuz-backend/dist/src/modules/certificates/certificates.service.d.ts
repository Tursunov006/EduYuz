import { PrismaService } from '../prisma/prisma.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
export declare class CertificatesService {
    private prisma;
    constructor(prisma: PrismaService);
    issue(dto: IssueCertificateDto): Promise<{
        student: {
            id: string;
            phone: string;
            fullName: string;
        };
    } & {
        id: string;
        studentId: string;
        courseTitle: string;
        certificateNumber: string;
        grade: string;
        issuedAt: Date;
    }>;
    findAll(): Promise<({
        student: {
            id: string;
            phone: string;
            fullName: string;
        };
    } & {
        id: string;
        studentId: string;
        courseTitle: string;
        certificateNumber: string;
        grade: string;
        issuedAt: Date;
    })[]>;
    verify(certificateNumber: string): Promise<{
        valid: boolean;
        message: string;
        certificateNumber?: undefined;
        studentName?: undefined;
        courseTitle?: undefined;
        grade?: undefined;
        issuedAt?: undefined;
        issuer?: undefined;
        status?: undefined;
    } | {
        valid: boolean;
        certificateNumber: string;
        studentName: string;
        courseTitle: string;
        grade: string;
        issuedAt: Date;
        issuer: string;
        status: string;
        message?: undefined;
    }>;
    findByStudent(studentId: string): Promise<{
        id: string;
        studentId: string;
        courseTitle: string;
        certificateNumber: string;
        grade: string;
        issuedAt: Date;
    }[]>;
}
