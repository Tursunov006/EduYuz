import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentToGroupDto } from './dto/add-student.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly access: AccessService,
  ) {}

  @Roles(RoleType.admin)
  @Post()
  async create(@Body() dto: CreateGroupDto, @CurrentUser() user: AuthUser) {
    dto.centerId = this.access.centerForCreate(user, dto.centerId);
    // Kurs va o'qituvchi ham shu markazga tegishli bo'lishi shart
    if (dto.courseId) await this.access.course(user, dto.courseId);
    if (dto.teacherId) await this.access.staff(user, dto.teacherId);
    return this.groupsService.create(dto, user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('centerId') centerId?: string,
    @Query('courseId') courseId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('archived') archived?: string,
  ) {
    return this.groupsService.findAll(
      this.access.scopeCenter(user, centerId),
      courseId,
      teacherId,
      archived === 'true',
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.group(user, id);
    return this.groupsService.findOne(id);
  }

  @Roles(RoleType.admin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.group(user, id);
    if (dto.courseId) await this.access.course(user, dto.courseId);
    if (dto.teacherId) await this.access.staff(user, dto.teacherId);
    return this.groupsService.update(id, dto);
  }

  @Roles(RoleType.admin)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.group(user, id);
    return this.groupsService.remove(id);
  }

  @Roles(RoleType.admin)
  @Post(':id/students')
  async addStudent(
    @Param('id') groupId: string,
    @Body() dto: AddStudentToGroupDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.group(user, groupId);
    await this.access.student(user, dto.studentId);
    return this.groupsService.addStudent(groupId, dto);
  }

  @Roles(RoleType.admin)
  @Delete(':id/students/:studentId')
  async removeStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.group(user, groupId);
    return this.groupsService.removeStudent(groupId, studentId);
  }
}
