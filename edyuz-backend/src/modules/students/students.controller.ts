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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AnketaDto } from './dto/anketa.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';
import { TelegramService } from '../telegram/telegram.service';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly access: AccessService,
    private readonly telegram: TelegramService,
  ) {}

  @Roles(RoleType.admin)
  @Post()
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: AuthUser) {
    dto.centerId = this.access.centerForCreate(user, dto.centerId);
    return this.studentsService.create(dto);
  }

  // Ro'yxat faqat xodimlar uchun va faqat o'z markazi doirasida
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('centerId') centerId?: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll(this.access.scopeCenter(user, centerId), search);
  }

  // O'quvchiga yuboriladigan anketa havolasi uchun kalit (faqat admin)
  @Roles(RoleType.admin)
  @Get(':id/anketa-link')
  async anketaLink(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.student(user, id);
    return { key: this.studentsService.anketaKey(id) };
  }

  // O'quvchi o'zi ochadigan anketa (login'siz, faqat to'g'ri kalit bilan)
  @Public()
  @Get('anketa/:id')
  getAnketa(@Param('id') id: string, @Query('k') key?: string) {
    return this.studentsService.getAnketa(id, key);
  }

  @Public()
  @Post('anketa/:id')
  async saveAnketa(@Param('id') id: string, @Query('k') key: string, @Body() dto: AnketaDto) {
    const result = await this.studentsService.saveAnketa(id, key, dto);
    // Anketa tugagach ota-onaga Telegram botga ulanish havolasi (QR uchun) qaytariladi.
    // Kalit to'g'ri bo'lgani uchun faqat shu o'quvchining o'z havolasi beriladi.
    const username = await this.telegram.getBotUsername();
    return { ...result, botLink: username ? `https://t.me/${username}?start=student_${id}` : null };
  }

  // Balanslarni to'lovlar tarixi bilan solishtirish (faqat admin).
  // apply=1 bo'lmasa faqat nomuvofiqliklar ro'yxati qaytariladi, hech narsa o'zgarmaydi.
  @Roles(RoleType.admin)
  @Post('reconcile-balances')
  reconcileBalances(
    @CurrentUser() user: AuthUser,
    @Query('apply') apply?: string,
    @Query('studentId') studentId?: string,
    @Query('centerId') centerId?: string,
  ) {
    return this.studentsService.reconcileBalances(this.access.scopeCenter(user, centerId), apply === '1', studentId);
  }

  // Arxiv: barcha o'quvchilar bazasi (pasport ma'lumotlari bilan) — faqat admin
  @Roles(RoleType.admin)
  @Get('registry')
  registry(@CurrentUser() user: AuthUser, @Query('centerId') centerId?: string) {
    return this.studentsService.registry(this.access.scopeCenter(user, centerId));
  }

  // O'quvchi/ota-ona portali (/portal, /app) shu endpoint orqali ishlaydi:
  // taxmin qilib bo'lmaydigan UUID havola "kalit" vazifasini bajaradi.
  // Anonim so'rovga faqat portal uchun kerakli maydonlar qaytariladi.
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    if (user) {
      await this.access.student(user, id);
      return this.studentsService.findOne(id);
    }
    return this.studentsService.findOnePublic(id);
  }

  @Roles(RoleType.admin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.student(user, id);
    return this.studentsService.update(id, dto);
  }

  @Roles(RoleType.admin)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.student(user, id);
    return this.studentsService.remove(id);
  }
}
