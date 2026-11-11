import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class CertificatesController {
    private readonly certificatesService;
    private readonly access;
    constructor(certificatesService: CertificatesService, access: AccessService);
    issue(dto: IssueCertificateDto, user: AuthUser): Promise<{
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
    findAll(user: AuthUser): Promise<({
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
    verify(certNumber: string): Promise<{
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
    findByStudent(studentId: string, user?: AuthUser): Promise<{
        id: string;
        studentId: string;
        courseTitle: string;
        certificateNumber: string;
        grade: string;
        issuedAt: Date;
    }[]>;
}
