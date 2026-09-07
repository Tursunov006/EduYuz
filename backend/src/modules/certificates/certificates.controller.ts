import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Public()
  @Post('issue')
  async issue(@Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(dto);
  }

  @Public()
  @Get()
  async findAll() {
    return this.certificatesService.findAll();
  }

  @Public()
  @Get('verify/:certNumber')
  async verify(@Param('certNumber') certNumber: string) {
    return this.certificatesService.verify(certNumber);
  }

  @Public()
  @Get('student/:studentId')
  async findByStudent(@Param('studentId') studentId: string) {
    return this.certificatesService.findByStudent(studentId);
  }
}
