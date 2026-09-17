import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentToGroupDto } from './dto/add-student.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    // 1. Markazni topish yoki yaratish
    let centerId = dto.centerId;
    if (!centerId) {
      let center = await this.prisma.center.findFirst();
      if (!center) {
        center = await this.prisma.center.create({
          data: { name: "EdYuz Bosh Markaz", phone: "+998901234567" },
        });
      }
      centerId = center.id;
    }

    // 2. Kursni topish yoki yaratish
    let courseId = dto.courseId;
    if (!courseId) {
      let course = await this.prisma.course.findFirst({ where: { centerId } });
      if (!course) {
        course = await this.prisma.course.create({
          data: { title: "Dasturlash Asoslari", price: 500000, centerId },
        });
      }
      courseId = course.id;
    }

    // 3. O'qituvchini topish yoki yaratish
    let teacherId = dto.teacherId;
    if (!teacherId) {
      let teacher = await this.prisma.user.findFirst({ where: { centerId, role: 'teacher' } });
      if (!teacher) {
        teacher = await this.prisma.user.create({
          data: {
            centerId,
            fullName: "Bosh O'qituvchi",
            phone: "+998900000001",
            passwordHash: "defaultpasswordhash",
            role: 'teacher',
          },
        });
      }
      teacherId = teacher.id;
    }

    let formattedDays = dto.days;
    if (typeof dto.days === 'string') {
      formattedDays = dto.days.split(/[-,\/]/).map((s: string) => s.trim());
    }

    return this.prisma.group.create({
      data: {
        centerId,
        courseId,
        teacherId,
        name: dto.name,
        days: formattedDays || ['Dushanba', 'Chorshanba', 'Juma'],
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      include: {
        course: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(centerId?: string, courseId?: string, teacherId?: string) {
    return this.prisma.group.findMany({
      where: {
        ...(centerId && { centerId }),
        ...(courseId && { courseId }),
        ...(teacherId && { teacherId }),
      },
      include: {
        course: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        course: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Guruh topilmadi');
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findOne(id);

    return this.prisma.group.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.group.delete({
      where: { id },
    });
  }

  async addStudent(groupId: string, dto: AddStudentToGroupDto) {
    await this.findOne(groupId);

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new NotFoundException('O\'quvchi topilmadi');
    }

    const existing = await this.prisma.groupStudent.findUnique({
      where: {
        groupId_studentId: {
          groupId,
          studentId: dto.studentId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('O\'quvchi ushbu guruhga allaqachon biriktirilgan');
    }

    return this.prisma.groupStudent.create({
      data: {
        groupId,
        studentId: dto.studentId,
      },
      include: {
        student: true,
      },
    });
  }

  async removeStudent(groupId: string, studentId: string) {
    const record = await this.prisma.groupStudent.findUnique({
      where: {
        groupId_studentId: {
          groupId,
          studentId,
        },
      },
    });

    if (!record) {
      throw new NotFoundException('O\'quvchi ushbu guruhda mavjud emas');
    }

    return this.prisma.groupStudent.delete({
      where: {
        groupId_studentId: {
          groupId,
          studentId,
        },
      },
    });
  }
}
