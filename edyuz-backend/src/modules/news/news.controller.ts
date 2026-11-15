import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';

// Platforma yangiliklari: o'qish — tizimga kirgan har bir xodim; yozish/o'chirish — faqat superadmin
@Controller('news')
export class NewsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.platformNews.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  }

  @Roles(RoleType.superadmin)
  @Post()
  create(@Body() dto: CreateNewsDto) {
    return this.prisma.platformNews.create({
      data: { title: dto.title.trim(), body: dto.body.trim(), link: dto.link?.trim() || null },
    });
  }

  @Roles(RoleType.superadmin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.platformNews.deleteMany({ where: { id } });
    return { success: true };
  }
}
