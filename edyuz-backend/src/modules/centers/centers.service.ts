import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@Injectable()
export class CentersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCenterDto) {
    return this.prisma.center.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.center.findMany({
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
            groups: true,
            students: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const center = await this.prisma.center.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
            groups: true,
            students: true,
          },
        },
      },
    });

    if (!center) {
      throw new NotFoundException('Markaz topilmadi');
    }

    return center;
  }

  async update(id: string, dto: UpdateCenterDto) {
    await this.findOne(id);

    return this.prisma.center.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.center.delete({
      where: { id },
    });
  }
}
