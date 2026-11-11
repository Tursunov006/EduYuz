import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

// O'qituvchilar va oylik maosh (payroll) — faqat markaz admini, o'z markazi doirasida
@Roles(RoleType.admin)
@Controller('teachers')
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly access: AccessService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('centerId') centerId?: string) {
    return this.teachersService.findAll(this.access.scopeCenter(user, centerId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.staff(user, id);
    return this.teachersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTeacherDto, @CurrentUser() user: AuthUser) {
    dto.centerId = this.access.centerForCreate(user, dto.centerId);
    return this.teachersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.staff(user, id);
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.staff(user, id);
    return this.teachersService.delete(id);
  }

  @Post(':id/pay-salary')
  async paySalary(
    @Param('id') id: string,
    @Body() dto: PaySalaryDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.staff(user, id);
    return this.teachersService.paySalary(id, dto);
  }

  @Get(':id/salary-history')
  async getSalaryHistory(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.staff(user, id);
    return this.teachersService.getSalaryHistory(id);
  }
}
