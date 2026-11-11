import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { UpdateCenterStatusDto, ResetDirectorPasswordDto } from './dto/center-admin.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

// Markazlarni boshqarish (yaratish, bloklash, parol tiklash, o'chirish) — faqat superadmin.
// Avval bu endpointlarning barchasi login'siz ochiq edi.
@Controller('centers')
export class CentersController {
  constructor(
    private readonly centersService: CentersService,
    private readonly access: AccessService,
  ) {}

  @Roles(RoleType.superadmin)
  @Post()
  create(@Body() dto: CreateCenterDto) {
    return this.centersService.create(dto);
  }

  // Superadmin barcha markazlarni, boshqa xodimlar faqat o'z markazini ko'radi
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.centersService.findAll(this.access.isSuperadmin(user) ? undefined : user.centerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.center(user, id);
    return this.centersService.findOne(id);
  }

  @Roles(RoleType.admin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCenterDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.center(user, id);
    return this.centersService.update(id, dto);
  }

  @Roles(RoleType.superadmin)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCenterStatusDto) {
    return this.centersService.updateStatus(id, dto.status, dto.days ?? 30);
  }

  @Roles(RoleType.superadmin)
  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetDirectorPasswordDto) {
    return this.centersService.resetDirectorPassword(id, dto.password);
  }

  @Roles(RoleType.superadmin)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    if (id === user.centerId) {
      throw new ForbiddenException("O'zingiz biriktirilgan tizim markazini o'chirib bo'lmaydi");
    }
    return this.centersService.remove(id);
  }
}
