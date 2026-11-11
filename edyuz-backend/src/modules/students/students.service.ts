import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const center = await this.prisma.center.findUnique({
      where: { id: dto.centerId },
    });
    if (!center) {
      throw new NotFoundException('Markaz topilmadi');
    }

    return this.prisma.student.create({
      data: {
        centerId: dto.centerId,
        fullName: dto.fullName,
        phone: dto.phone,
        parentPhone: dto.parentPhone,
        parentChatId: dto.parentChatId ? BigInt(dto.parentChatId) : null,
        balance: dto.balance !== undefined ? dto.balance : 0,
        status: dto.status,
      },
    });
  }

  async findAll(centerId?: string, search?: string) {
    return this.prisma.student.findMany({
      where: {
        ...(centerId && { centerId }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { parentPhone: { contains: search } },
          ],
        }),
      },
      include: {
        groups: {
          include: {
            group: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Portal uchun: ota-ona telefoni, Telegram chat ID kabi ichki maydonlarsiz
  async findOnePublic(id: string) {
    const student = await this.findOne(id);
    const { parentPhone, parentChatId, phone, centerId, ...safe } = student as any;
    return safe;
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            group: {
              include: {
                course: true,
                teacher: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 10,
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('O\'quvchi topilmadi');
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);

    const dataToUpdate: any = {
      fullName: dto.fullName,
      phone: dto.phone,
      parentPhone: dto.parentPhone,
      status: dto.status,
    };

    if (dto.parentChatId !== undefined) {
      dataToUpdate.parentChatId = dto.parentChatId ? BigInt(dto.parentChatId) : null;
    }

    if (dto.balance !== undefined) {
      dataToUpdate.balance = dto.balance;
    }

    return this.prisma.student.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Prisma schema da payments Restrict qilingani uchun avval to'lovlar tozalanadi.
    // Ikkala amal bitta tranzaksiyada: o'rtada xato bo'lsa to'lovlar yo'qolib qolmaydi.
    const [, deleted] = await this.prisma.$transaction([
      this.prisma.payment.deleteMany({ where: { studentId: id } }),
      this.prisma.student.delete({ where: { id } }),
    ]);
    return deleted;
  }
}
