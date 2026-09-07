import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { LmsService } from './lms.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Public()
  @Get('groups/:groupId/lessons')
  async getLessons(@Param('groupId') groupId: string) {
    return this.lmsService.getLessonsByGroup(groupId);
  }

  @Public()
  @Post('lessons')
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.lmsService.createLesson(dto);
  }

  @Public()
  @Delete('lessons/:id')
  async deleteLesson(@Param('id') id: string) {
    return this.lmsService.deleteLesson(id);
  }

  @Public()
  @Post('homeworks')
  async createHomework(@Body() dto: CreateHomeworkDto) {
    return this.lmsService.createHomework(dto);
  }

  @Public()
  @Post('homeworks/submit')
  async submitHomework(@Body() dto: SubmitHomeworkDto) {
    return this.lmsService.submitHomework(dto);
  }

  @Public()
  @Post('homeworks/grade/:submissionId')
  async gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.lmsService.gradeSubmission(submissionId, dto);
  }

  @Public()
  @Get('homeworks/:homeworkId/submissions')
  async getSubmissions(@Param('homeworkId') homeworkId: string) {
    return this.lmsService.getSubmissionsByHomework(homeworkId);
  }
}
