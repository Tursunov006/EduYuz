import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    const title = dto.title.trim().replace(/\s+/g, ' ');
    await this.assertTitleFree(dto.centerId, title);
    return this.prisma.course.create({
      data: { centerId: dto.centerId, title, price: dto.price },
    });
  }

  // Bir markazda bir xil nomli fan ikkinchi marta qo'shilmasin (katta-kichik harf farqsiz)
  private async assertTitleFree(centerId: string, title: string, exceptId?: string) {
    const dup = await this.prisma.course.findFirst({
      where: {
        centerId,
        title: { equals: title, mode: 'insensitive' },
        ...(exceptId && { id: { not: exceptId } }),
      },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`«${title}» nomli fan allaqachon bor`);
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
    const current = await this.findOne(id);
    if (dto.title) {
      dto.title = dto.title.trim().replace(/\s+/g, ' ');
      await this.assertTitleFree(current.centerId, dto.title, id);
    }

    return this.prisma.course.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const course = await this.findOne(id);
    if (course.groups.length > 0) {
      throw new ConflictException(
        `Bu fanga ${course.groups.length} ta guruh bog'langan — avval guruhlarni boshqa fanga o'tkazing`,
      );
    }
    return this.prisma.course.delete({
      where: { id },
    });
  }
}
