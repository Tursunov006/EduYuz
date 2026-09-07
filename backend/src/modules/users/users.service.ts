import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const center = await this.prisma.center.findUnique({
      where: { id: dto.centerId },
    });
    if (!center) {
      throw new NotFoundException('Ko\'rsatilgan markaz topilmadi');
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Ushbu telefon raqamli foydalanuvchi allaqachon mavjud');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        centerId: dto.centerId,
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        centerId: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(centerId?: string) {
    return this.prisma.user.findMany({
      where: centerId ? { centerId } : {},
      select: {
        id: true,
        centerId: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        centerId: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const dataToUpdate: any = {
      fullName: dto.fullName,
      phone: dto.phone,
      role: dto.role,
      isActive: dto.isActive,
    };

    if (dto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        centerId: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
