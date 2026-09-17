import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Public()
  @Post('mark')
  markAttendance(
    @Body() dto: MarkAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.attendanceService.markGroupAttendance(dto, userId);
  }

  @Public()
  @Get('group/:groupId')
  findByGroupAndDate(
    @Param('groupId') groupId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.findByGroupAndDate(groupId, date);
  }

  @Get('student/:studentId')
  getStudentAttendance(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentAttendance(studentId);
  }
}
