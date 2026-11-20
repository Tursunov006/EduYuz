import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateAnnouncementDto } from './announcements.dto';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
  ) {}

  list(centerId: string) {
    return this.prisma.announcement.findMany({
      where: { centerId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
  }

  async create(centerId: string, authorName: string, dto: CreateAnnouncementDto) {
    const ann = await this.prisma.announcement.create({
      data: {
        centerId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        target: dto.target || 'all',
        priority: dto.priority || 'medium',
        authorName: authorName || null,
      },
    });
    if (!dto.sendTelegram) return { announcement: ann, sent: 0, message: "E'lon saqlandi" };
    const res = await this.send(centerId, ann.id);
    return { announcement: { ...ann, sentCount: res.sent }, ...res };
  }

  private async find(centerId: string, id: string) {
    const ann = await this.prisma.announcement.findFirst({ where: { id, centerId } });
    if (!ann) throw new NotFoundException("E'lon topilmadi");
    return ann;
  }

  async update(centerId: string, id: string, isPinned?: boolean) {
    await this.find(centerId, id);
    return this.prisma.announcement.update({ where: { id }, data: { ...(isPinned !== undefined ? { isPinned } : {}) } });
  }

  async remove(centerId: string, id: string) {
    await this.find(centerId, id);
    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }

  /**
   * E'lonni Telegram bot orqali yuborish. Botga ulangan ota-onalar (o'quvchi kartasidagi parentChatId)ga boradi.
   * O'qituvchilar botga ulanmagan — ular uchun Telegram yuborilmaydi.
   */
  async send(centerId: string, id: string) {
    const ann = await this.find(centerId, id);
    if (ann.target === 'teachers') {
      return { sent: 0, total: 0, message: "O'qituvchilar Telegram botga ulanmagan — e'lon faqat platformada ko'rinadi" };
    }
    const students = await this.prisma.student.findMany({
      where: { centerId, status: { not: 'inactive' }, parentChatId: { not: null } },
      select: { parentChatId: true },
    });
    const chatIds = [...new Set(students.map((s) => String(s.parentChatId)))];
    const icon = ann.priority === 'high' ? '🔴' : ann.priority === 'low' ? '🔵' : '📢';
    const text = `${icon} <b>${esc(ann.title)}</b>\n\n${esc(ann.content)}`;
    let sent = 0;
    for (const chatId of chatIds) {
      if (await this.telegram.sendMessage(chatId, text).catch(() => false)) sent++;
    }
    await this.prisma.announcement.update({ where: { id }, data: { sentCount: { increment: sent } } });
    return {
      sent,
      total: chatIds.length,
      message: chatIds.length
        ? `E'lon ${sent} ta ota-onaga Telegram orqali yuborildi${sent < chatIds.length ? ` (${chatIds.length - sent} tasiga yetib bormadi)` : ''}`
        : "Hali hech bir ota-ona Telegram botga ulanmagan — e'lon faqat platformada saqlandi",
    };
  }
}
