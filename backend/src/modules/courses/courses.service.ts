import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const center = await this.prisma.center.findUnique({
      where: { id: dto.centerId },
    });

    if (!center) {
      throw new NotFoundException('Ko\'rsatilgan markaz topilmadi');
    }

    return this.prisma.course.create({
      data: dto,
    });
  }

  async findAll(centerId?: string) {
    return this.prisma.course.findMany({
      where: centerId ? { centerId } : {},
      include: {
        _count: {
          select: {
            groups: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            teacher: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Kurs topilmadi');
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);

    return this.prisma.course.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.course.delete({
      where: { id },
    });
  }
}
