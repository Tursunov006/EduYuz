import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto, UpdateCertificateDto } from './dto/issue-certificate.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

@Controller('certificates')
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly access: AccessService,
  ) {}

  // Sertifikat berish — faqat admin. Avval ochiq edi: istalgan odam o'ziga
  // "rasmiy" QR-sertifikat chiqarib, /verify sahifasida "haqiqiy" deb ko'rsata olardi.
  @Roles(RoleType.admin)
  @Post('issue')
  async issue(@Body() dto: IssueCertificateDto, @CurrentUser() user: AuthUser) {
    await this.access.student(user, dto.studentId);
    return this.certificatesService.issue(dto);
  }

  // Sertifikatni tahrirlash (kurs nomi, baho) — faqat admin
  @Roles(RoleType.admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCertificateDto, @CurrentUser() user: AuthUser) {
    const cert = await this.certificatesService.findOne(id);
    await this.access.student(user, cert.studentId);
    return this.certificatesService.update(id, dto);
  }

  // Sertifikatni bekor qilish (o'chirish) — faqat admin; QR tekshiruvda endi "topilmadi" chiqadi
  @Roles(RoleType.admin)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const cert = await this.certificatesService.findOne(id);
    await this.access.student(user, cert.studentId);
    return this.certificatesService.remove(id);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.certificatesService.findAll(this.access.scopeCenter(user));
  }

  // Ochiq tekshirish sahifasi (QR-kod)
  @Public()
  @Get('verify/:certNumber')
  async verify(@Param('certNumber') certNumber: string) {
    return this.certificatesService.verify(certNumber);
  }

  @Public()
  @Get('student/:studentId')
  async findByStudent(@Param('studentId') studentId: string, @CurrentUser() user?: AuthUser) {
    if (user) await this.access.student(user, studentId);
    return this.certificatesService.findByStudent(studentId);
  }
}
