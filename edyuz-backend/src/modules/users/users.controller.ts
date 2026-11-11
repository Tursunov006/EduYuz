import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

// Xodimlarni boshqarish — faqat markaz admini (o'z markazi doirasida) va superadmin
@Roles(RoleType.admin)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly access: AccessService,
  ) {}

  private assertRoleAllowed(user: AuthUser, role?: RoleType) {
    if (role === RoleType.superadmin && !this.access.isSuperadmin(user)) {
      throw new ForbiddenException("Superadmin rolini berish huquqingiz yo'q");
    }
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    this.assertRoleAllowed(user, dto.role);
    dto.centerId = this.access.centerForCreate(user, dto.centerId);
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('centerId') centerId?: string) {
    return this.usersService.findAll(this.access.scopeCenter(user, centerId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.staff(user, id);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.staff(user, id);
    this.assertRoleAllowed(user, dto.role);
    if (id === user.id && (dto.isActive === false || (dto.role && dto.role !== user.role))) {
      throw new ForbiddenException("O'z hisobingiz rolini o'zgartira yoki o'chira olmaysiz");
    }
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.staff(user, id);
    if (id === user.id) {
      throw new ForbiddenException("O'z hisobingizni o'chira olmaysiz");
    }
    return this.usersService.remove(id);
  }
}
