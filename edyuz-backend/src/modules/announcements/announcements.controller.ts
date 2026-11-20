import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './announcements.dto';

// Markaz e'lonlari: o'qish — markaz xodimlari; yaratish/o'chirish/yuborish — admin
@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private service: AnnouncementsService,
    private access: AccessService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('centerId') centerId?: string) {
    return this.service.list(this.access.centerForCreate(user, centerId));
  }

  @Roles(RoleType.admin)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(user.centerId, user.fullName, dto);
  }

  @Roles(RoleType.admin)
  @Post(':id/send')
  send(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.send(user.centerId, id);
  }

  @Roles(RoleType.admin)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(user.centerId, id, dto.isPinned);
  }

  @Roles(RoleType.admin)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.centerId, id);
  }
}
