import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll(centerId?: string) {
    const currentPeriod = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const where: any = { role: 'teacher' };
    if (centerId) {
      where.centerId = centerId;
    }

    const teachers = await this.prisma.user.findMany({
      where,
      include: {
        groups: {
          include: {
            course: true,
            students: {
              include: {
                student: true,
              },
            },
          },
        },
        salaryPayments: {
          orderBy: { paidAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return teachers.map((teacher) => {
      let totalStudentsCount = 0;
      let monthlyGrossRevenue = 0;

      const groupSummaries = teacher.groups.map((g) => {
        const studentCount = g.students.length;
        totalStudentsCount += studentCount;
        const groupRevenue = studentCount * Number(g.course?.price || 0);
        monthlyGrossRevenue += groupRevenue;

        return {
          id: g.id,
          name: g.name,
          courseTitle: g.course?.title,
          coursePrice: Number(g.course?.price || 0),
          studentCount,
          days: g.days,
          time: g.startTime + ' - ' + g.endTime,
        };
      });

      const salaryRate = Number(teacher.salaryRate || 0);
      let expectedMonthlySalary = 0;
      if (teacher.salaryType === 'percentage') {
        expectedMonthlySalary = Math.round(monthlyGrossRevenue * (salaryRate / 100));
      } else {
        expectedMonthlySalary = salaryRate;
      }

      const currentMonthPaid = teacher.salaryPayments
        .filter((sp) => sp.periodMonth === currentPeriod)
        .reduce((sum, sp) => sum + Number(sp.amount), 0);

      const remainingSalary = Math.max(0, expectedMonthlySalary - currentMonthPaid);

      return {
        id: teacher.id,
        centerId: teacher.centerId,
        fullName: teacher.fullName,
        phone: teacher.phone,
        specialty: teacher.specialty || 'Asosiy ustoz',
        salaryType: teacher.salaryType,
        salaryRate,
        isActive: teacher.isActive,
        createdAt: teacher.createdAt,
        groups: groupSummaries,
        totalGroups: teacher.groups.length,
        totalStudents: totalStudentsCount,
        monthlyGrossRevenue,
        expectedMonthlySalary,
        currentMonthPaid,
        remainingSalary,
        currentPeriod,
        recentPayments: teacher.salaryPayments.slice(0, 5),
      };
    });
  }

  async findOne(id: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            course: true,
            students: {
              include: {
                student: true,
              },
            },
          },
        },
        salaryPayments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!teacher || teacher.role !== 'teacher') {
      throw new NotFoundException("O'qituvchi topilmadi");
    }

    return teacher;
  }

  async create(dto: CreateTeacherDto) {
    let centerId = dto.centerId;
    if (!centerId) {
      const firstCenter = await this.prisma.center.findFirst();
      if (!firstCenter) {
        throw new NotFoundException('Tizimda o\'quv markazi topilmadi');
      }
      centerId = firstCenter.id;
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException("Ushbu telefon raqam bilan foydalanuvchi ro'yxatdan o'tgan");
    }

    const rawPassword = dto.password || 'teacher123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    return this.prisma.user.create({
      data: {
        centerId,
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        role: 'teacher',
        specialty: dto.specialty || 'Ustoz',
        salaryType: dto.salaryType || 'percentage',
        salaryRate: dto.salaryRate !== undefined ? dto.salaryRate : 50.0,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        specialty: true,
        salaryType: true,
        salaryRate: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.user.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException("O'qituvchi topilmadi");
    }

    const data: any = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.specialty !== undefined) data.specialty = dto.specialty;
    if (dto.salaryType !== undefined) data.salaryType = dto.salaryType;
    if (dto.salaryRate !== undefined) data.salaryRate = dto.salaryRate;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const teacher = await this.prisma.user.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException("O'qituvchi topilmadi");
    }

    return this.prisma.user.delete({ where: { id } });
  }

  async paySalary(teacherId: string, dto: PaySalaryDto) {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException("O'qituvchi topilmadi");
    }

    return this.prisma.salaryPayment.create({
      data: {
        teacherId,
        amount: dto.amount,
        periodMonth: dto.periodMonth,
        paymentMethod: dto.paymentMethod || 'cash',
        comment: dto.comment,
      },
    });
  }

  async getSalaryHistory(teacherId: string) {
    return this.prisma.salaryPayment.findMany({
      where: { teacherId },
      orderBy: { paidAt: 'desc' },
    });
  }
}
