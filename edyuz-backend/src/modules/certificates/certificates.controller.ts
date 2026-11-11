import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
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
