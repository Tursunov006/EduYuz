import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  findAll(@Query('centerId') centerId?: string) {
    return this.teachersService.findAll(centerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.teachersService.delete(id);
  }

  @Post(':id/pay-salary')
  paySalary(@Param('id') id: string, @Body() dto: PaySalaryDto) {
    return this.teachersService.paySalary(id, dto);
  }

  @Get(':id/salary-history')
  getSalaryHistory(@Param('id') id: string) {
    return this.teachersService.getSalaryHistory(id);
  }
}
