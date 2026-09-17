import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentToGroupDto } from './dto/add-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Public()
  @Get()
  findAll(
    @Query('centerId') centerId?: string,
    @Query('courseId') courseId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.groupsService.findAll(centerId, courseId, teacherId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  @Public()
  @Post(':id/students')
  addStudent(@Param('id') groupId: string, @Body() dto: AddStudentToGroupDto) {
    return this.groupsService.addStudent(groupId, dto);
  }

  @Public()
  @Delete(':id/students/:studentId')
  removeStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.groupsService.removeStudent(groupId, studentId);
  }
}
