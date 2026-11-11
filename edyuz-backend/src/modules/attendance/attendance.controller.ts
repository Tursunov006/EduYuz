import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly access: AccessService,
  ) {}

  @Post('face-scan')
  async faceScan(@Body('image') image: string, @CurrentUser() user: AuthUser) {
    if (!image || typeof image !== 'string') {
      throw new BadRequestException('Rasm yuborilmadi');
    }
    return this.attendanceService.processFaceScan(image, user.centerId);
  }

  @Post('mark')
  async markAttendance(@Body() dto: MarkAttendanceDto, @CurrentUser() user: AuthUser) {
    await this.access.group(user, dto.groupId);
    return this.attendanceService.markGroupAttendance(dto, user.id);
  }

  @Get('group/:groupId')
  async findByGroupAndDate(
    @Param('groupId') groupId: string,
    @Query('date') date: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.group(user, groupId);
    return this.attendanceService.findByGroupAndDate(groupId, date);
  }

  // O'quvchi portali uchun ochiq (UUID havola orqali); xodim uchun markaz tekshiriladi
  @Public()
  @Get('student/:studentId')
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @CurrentUser() user?: AuthUser,
  ) {
    if (user) await this.access.student(user, studentId);
    return this.attendanceService.getStudentAttendance(studentId);
  }
}
