"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CertificatesService = class CertificatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async issue(dto) {
        const student = await this.prisma.student.findUnique({
            where: { id: dto.studentId },
        });
        if (!student)
            throw new common_1.NotFoundException('O\'quvchi topilmadi');
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const year = new Date().getFullYear();
        const certificateNumber = `EDU-${year}-${randomCode}`;
        return this.prisma.certificate.create({
            data: {
                certificateNumber,
                studentId: dto.studentId,
                courseTitle: dto.courseTitle,
                grade: dto.grade || 'A+',
                issuedAt: new Date(),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
            },
        });
    }
    async findAll() {
        return this.prisma.certificate.findMany({
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    },
                },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }
    async verify(certificateNumber) {
        const cert = await this.prisma.certificate.findUnique({
            where: { certificateNumber },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
        if (!cert) {
            return {
                valid: false,
                message: 'Bunday raqamli sertifikat topilmadi yoki soxta!',
            };
        }
        return {
            valid: true,
            certificateNumber: cert.certificateNumber,
            studentName: cert.student.fullName,
            courseTitle: cert.courseTitle,
            grade: cert.grade,
            issuedAt: cert.issuedAt,
            issuer: "EduYuz O'quv Markazlari Tarmog'i",
            status: "Tasdiqlangan va Haqiqiy"
        };
    }
    async findByStudent(studentId) {
        return this.prisma.certificate.findMany({
            where: { studentId },
            orderBy: { issuedAt: 'desc' },
        });
    }
};
exports.CertificatesService = CertificatesService;
exports.CertificatesService = CertificatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CertificatesService);
//# sourceMappingURL=certificates.service.js.map