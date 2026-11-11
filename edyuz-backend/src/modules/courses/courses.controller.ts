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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly access: AccessService,
  ) {}

  @Roles(RoleType.admin)
  @Post()
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthUser) {
    dto.centerId = this.access.centerForCreate(user, dto.centerId);
    return this.coursesService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('centerId') centerId?: string) {
    return this.coursesService.findAll(this.access.scopeCenter(user, centerId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.course(user, id);
    return this.coursesService.findOne(id);
  }

  @Roles(RoleType.admin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.course(user, id);
    return this.coursesService.update(id, dto);
  }

  @Roles(RoleType.admin)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.course(user, id);
    return this.coursesService.remove(id);
  }
}
