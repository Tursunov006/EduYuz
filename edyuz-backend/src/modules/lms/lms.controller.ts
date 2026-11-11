import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { LmsService } from './lms.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { CreateQuizDto, SubmitQuizDto } from './dto/quiz.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

// O'quvchi tomoni (darslarni ko'rish, vazifa/test topshirish) portal uchun ochiq qoladi.
// O'qituvchi tomoni (dars/vazifa/test yaratish, o'chirish, baholash) endi login talab qiladi —
// avval istalgan odam darslarni o'chirib, o'ziga 100 ball qo'yib ola olardi.
@Controller('lms')
export class LmsController {
  constructor(
    private readonly lmsService: LmsService,
    private readonly access: AccessService,
  ) {}

  @Public()
  @Get('groups/:groupId/lessons')
  async getLessons(@Param('groupId') groupId: string, @CurrentUser() user?: AuthUser) {
    if (user) {
      await this.access.group(user, groupId);
      return this.lmsService.getLessonsByGroup(groupId);
    }
    // Anonim (o'quvchi) uchun: test javoblari va boshqa o'quvchilar telefonlari yashiriladi
    return this.lmsService.getLessonsByGroupPublic(groupId);
  }

  @Post('lessons')
  async createLesson(@Body() dto: CreateLessonDto, @CurrentUser() user: AuthUser) {
    await this.access.group(user, dto.groupId);
    return this.lmsService.createLesson(dto);
  }

  @Delete('lessons/:id')
  async deleteLesson(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.lesson(user, id);
    return this.lmsService.deleteLesson(id);
  }

  @Post('homeworks')
  async createHomework(@Body() dto: CreateHomeworkDto, @CurrentUser() user: AuthUser) {
    await this.access.lesson(user, dto.lessonId);
    return this.lmsService.createHomework(dto);
  }

  @Public()
  @Post('homeworks/submit')
  async submitHomework(@Body() dto: SubmitHomeworkDto) {
    return this.lmsService.submitHomework(dto);
  }

  @Post('homeworks/grade/:submissionId')
  async gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.submission(user, submissionId);
    return this.lmsService.gradeSubmission(submissionId, dto);
  }

  @Get('homeworks/:homeworkId/submissions')
  async getSubmissions(@Param('homeworkId') homeworkId: string, @CurrentUser() user: AuthUser) {
    await this.access.homework(user, homeworkId);
    return this.lmsService.getSubmissionsByHomework(homeworkId);
  }

  @Post('quiz')
  async createQuiz(@Body() dto: CreateQuizDto, @CurrentUser() user: AuthUser) {
    await this.access.lesson(user, dto.lessonId);
    return this.lmsService.createQuiz(dto.lessonId, dto.title, dto.questions);
  }

  @Public()
  @Post('quiz/submit')
  async submitQuiz(@Body() dto: SubmitQuizDto) {
    return this.lmsService.submitQuiz(dto.quizId, dto.studentId, dto.answers);
  }
}
