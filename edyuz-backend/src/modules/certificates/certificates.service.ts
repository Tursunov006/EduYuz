import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  // 1. Yangi sertifikat berish
  async issue(dto: IssueCertificateDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('O\'quvchi topilmadi');

    // Takrorlanmas sertifikat raqami: EDU-2026-XXXXXXXX
    // Avval atigi 4 xonali tasodifiy son edi (9000 variant): raqamlar tez-tez to'qnashib
    // 500 xato berardi va ketma-ket sinab ko'rish bilan begona sertifikatlarni topish oson edi.
    const year = new Date().getFullYear();

    for (let attempt = 0; attempt < 5; attempt++) {
      const certificateNumber = `EDU-${year}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const taken = await this.prisma.certificate.findUnique({
        where: { certificateNumber },
        select: { id: true },
      });
      if (taken) continue;

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

    throw new ConflictException("Sertifikat raqamini yaratib bo'lmadi, qayta urinib ko'ring");
  }

  // 2. Barcha sertifikatlar ro'yxati
  async findAll(centerId?: string) {
    return this.prisma.certificate.findMany({
      where: centerId ? { student: { centerId } } : {},
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

  // 3. QR-kod orqali tekshirish (Public Verification)
  async verify(certificateNumber: string) {
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

  // 4. Bitta o'quvchining sertifikatlari
  async findByStudent(studentId: string) {
    return this.prisma.certificate.findMany({
      where: { studentId },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
